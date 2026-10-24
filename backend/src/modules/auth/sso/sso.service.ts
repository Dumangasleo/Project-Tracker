import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { Repository } from 'typeorm';
import type { ApiEnv } from '../../../config/env.validation';
import type { TeamMember } from '../../team/entities/team-member.entity';
import { SSO_STATE_AUDIENCE } from '../auth.constants';
import { ExternalIdentity } from '../entities/external-identity.entity';
import type {
  AuthSession,
  SessionContext,
} from '../interfaces/session.interfaces';
import { AuthService, normalizeEmail } from '../services/auth.service';
import {
  buildOidcProviders,
  type OidcProvider,
  type VerifiedIdentity,
} from './oidc-providers';
import { SsoProvider } from './sso-provider.enum';

export class SsoError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

interface SsoState {
  provider: SsoProvider;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface SsoCallbackParams {
  code?: string;
  state?: string;
  error?: string;
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);
  private readonly providers: Map<SsoProvider, OidcProvider>;
  private readonly keySets = new Map<
    SsoProvider,
    ReturnType<typeof createRemoteJWKSet>
  >();
  private readonly callbackBaseUrl: string;

  constructor(
    config: ConfigService<ApiEnv, true>,
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    @InjectRepository(ExternalIdentity)
    private readonly identities: Repository<ExternalIdentity>,
  ) {
    this.providers = buildOidcProviders({
      GOOGLE_CLIENT_ID: config.get('GOOGLE_CLIENT_ID', { infer: true }),
      GOOGLE_CLIENT_SECRET: config.get('GOOGLE_CLIENT_SECRET', { infer: true }),
      MICROSOFT_CLIENT_ID: config.get('MICROSOFT_CLIENT_ID', { infer: true }),
      MICROSOFT_CLIENT_SECRET: config.get('MICROSOFT_CLIENT_SECRET', {
        infer: true,
      }),
      MICROSOFT_TENANT_ID: config.get('MICROSOFT_TENANT_ID', { infer: true }),
    });
    this.callbackBaseUrl = config
      .get('SSO_CALLBACK_BASE_URL', { infer: true })
      .replace(/\/$/, '');
  }

  enabledProviders(): SsoProvider[] {
    return [...this.providers.keys()];
  }

  async createAuthorizationRequest(
    providerId: SsoProvider,
  ): Promise<{ url: string; stateToken: string }> {
    const provider = this.getProvider(providerId);
    const state: SsoState = {
      provider: providerId,
      state: randomToken(),
      nonce: randomToken(),
      codeVerifier: randomToken(),
    };

    const url = new URL(provider.authorizationEndpoint);
    url.search = new URLSearchParams({
      client_id: provider.clientId,
      response_type: 'code',
      response_mode: 'query',
      redirect_uri: this.redirectUri(providerId),
      scope: provider.scope,
      state: state.state,
      nonce: state.nonce,
      code_challenge: sha256Base64Url(state.codeVerifier),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString();

    const stateToken = await this.jwt.signAsync(
      { ...state },
      { audience: SSO_STATE_AUDIENCE, expiresIn: 600 },
    );
    return { url: url.toString(), stateToken };
  }

  async completeAuthorization(
    providerId: SsoProvider,
    params: SsoCallbackParams,
    stateToken: string | undefined,
    context: SessionContext,
  ): Promise<AuthSession> {
    if (params.error) throw new SsoError('provider_denied');
    if (!params.code || !params.state) throw new SsoError('invalid_callback');

    const provider = this.getProvider(providerId);
    const saved = await this.readState(stateToken);
    if (
      saved.provider !== providerId ||
      !safeEqual(saved.state, params.state)
    ) {
      throw new SsoError('state_mismatch');
    }

    const idToken = await this.exchangeCode(
      provider,
      params.code,
      saved.codeVerifier,
    );
    const claims = await this.verifyIdToken(provider, idToken, saved.nonce);

    const identity = provider.toIdentity(claims);
    if (!identity) throw new SsoError('email_not_verified');

    const member = await this.resolveMember(providerId, identity);
    return this.auth.startSession(member, context);
  }

  private getProvider(providerId: SsoProvider): OidcProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new SsoError('provider_unavailable');
    return provider;
  }

  private redirectUri(providerId: SsoProvider): string {
    return `${this.callbackBaseUrl}/api/v1/auth/sso/${providerId}/callback`;
  }

  private async readState(stateToken: string | undefined): Promise<SsoState> {
    if (!stateToken) throw new SsoError('state_missing');
    try {
      return await this.jwt.verifyAsync<SsoState>(stateToken, {
        audience: SSO_STATE_AUDIENCE,
      });
    } catch {
      throw new SsoError('state_invalid');
    }
  }

  private async exchangeCode(
    provider: OidcProvider,
    code: string,
    codeVerifier: string,
  ): Promise<string> {
    const response = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri(provider.id),
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code_verifier: codeVerifier,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      id_token?: string;
      error?: string;
    };
    if (!response.ok || !body.id_token) {
      this.logger.warn(
        `Token exchange with ${provider.id} failed: ${response.status} ${body.error ?? ''}`,
      );
      throw new SsoError('token_exchange_failed');
    }
    return body.id_token;
  }

  private async verifyIdToken(
    provider: OidcProvider,
    idToken: string,
    expectedNonce: string,
  ): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(idToken, this.keySet(provider), {
        audience: provider.clientId,
        algorithms: ['RS256'],
        clockTolerance: 60,
      });
      if (!provider.isTrustedIssuer(payload)) throw new Error('issuer');
      if (payload.nonce !== expectedNonce) throw new Error('nonce');
      return payload;
    } catch (error) {
      this.logger.warn(
        `ID token from ${provider.id} rejected: ${(error as Error).message}`,
      );
      throw new SsoError('invalid_id_token');
    }
  }

  private keySet(provider: OidcProvider) {
    let keySet = this.keySets.get(provider.id);
    if (!keySet) {
      keySet = createRemoteJWKSet(new URL(provider.jwksUri));
      this.keySets.set(provider.id, keySet);
    }
    return keySet;
  }

  private async resolveMember(
    providerId: SsoProvider,
    identity: VerifiedIdentity,
  ): Promise<TeamMember> {
    const linked = await this.identities.findOne({
      where: { provider: providerId, subject: identity.subject },
      relations: { member: true },
    });
    if (linked) return linked.member;

    const email = normalizeEmail(identity.email);
    const member =
      (await this.auth.findMemberByEmail(email)) ??
      (await this.auth.createMember({
        firstName: identity.firstName,
        lastName: identity.lastName,
        email,
        passwordHash: null,
      }));

    await this.identities.insert({
      provider: providerId,
      subject: identity.subject,
      memberId: member.id,
      email,
    });
    return member;
  }
}

function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

function sha256Base64Url(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
