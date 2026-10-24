import type { JWTPayload } from 'jose';
import type { ApiEnv } from '../../../config/env.validation';
import { SsoProvider } from './sso-provider.enum';

const MICROSOFT_CONSUMER_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad';

export interface VerifiedIdentity {
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OidcProvider {
  id: SsoProvider;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  scope: string;
  isTrustedIssuer(claims: JWTPayload): boolean;
  /** Returns null when the provider cannot vouch that the email belongs to the user. */
  toIdentity(claims: JWTPayload): VerifiedIdentity | null;
}

export type SsoEnv = Pick<
  ApiEnv,
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
  | 'MICROSOFT_CLIENT_ID'
  | 'MICROSOFT_CLIENT_SECRET'
  | 'MICROSOFT_TENANT_ID'
>;

type Claims = JWTPayload & Record<string, unknown>;

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

function splitName(claims: Claims, email: string) {
  const fullName = text(claims.name) ?? email.split('@')[0];
  const [first, ...rest] = fullName.split(/\s+/);
  return {
    firstName: (text(claims.given_name) ?? first).slice(0, 50),
    lastName: (text(claims.family_name) ?? (rest.join(' ') || '-')).slice(
      0,
      50,
    ),
  };
}

function googleProvider(env: SsoEnv): OidcProvider | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;

  return {
    id: SsoProvider.Google,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    scope: 'openid email profile',
    isTrustedIssuer: (claims) =>
      claims.iss === 'https://accounts.google.com' ||
      claims.iss === 'accounts.google.com',
    toIdentity: (raw) => {
      const claims = raw as Claims;
      const email = text(claims.email);
      if (!email || claims.email_verified !== true || !claims.sub) return null;
      return { subject: claims.sub, email, ...splitName(claims, email) };
    },
  };
}

function microsoftProvider(env: SsoEnv): OidcProvider | null {
  if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) return null;

  const tenant = env.MICROSOFT_TENANT_ID;
  const base = `https://login.microsoftonline.com/${tenant}`;
  const isMultiTenant = ['common', 'organizations', 'consumers'].includes(
    tenant,
  );

  return {
    id: SsoProvider.Microsoft,
    clientId: env.MICROSOFT_CLIENT_ID,
    clientSecret: env.MICROSOFT_CLIENT_SECRET,
    authorizationEndpoint: `${base}/oauth2/v2.0/authorize`,
    tokenEndpoint: `${base}/oauth2/v2.0/token`,
    jwksUri: `${base}/discovery/v2.0/keys`,
    scope: 'openid email profile',
    isTrustedIssuer: (raw) => {
      const tid = text((raw as Claims).tid);
      if (!tid || (!isMultiTenant && tid !== tenant)) return false;
      return raw.iss === `https://login.microsoftonline.com/${tid}/v2.0`;
    },
    toIdentity: (raw) => {
      const claims = raw as Claims;
      const isConsumer = claims.tid === MICROSOFT_CONSUMER_TENANT;
      // Work accounts only prove email ownership through the optional xms_edov claim.
      const emailVerified =
        isConsumer || claims.xms_edov === true || claims.xms_edov === 1;
      const email =
        text(claims.email) ??
        (isConsumer ? text(claims.preferred_username) : undefined);
      if (!email || !emailVerified || !claims.sub) return null;
      return { subject: claims.sub, email, ...splitName(claims, email) };
    },
  };
}

export function buildOidcProviders(
  env: SsoEnv,
): Map<SsoProvider, OidcProvider> {
  const providers = [googleProvider(env), microsoftProvider(env)].filter(
    (provider): provider is OidcProvider => provider !== null,
  );
  return new Map(providers.map((provider) => [provider.id, provider]));
}
