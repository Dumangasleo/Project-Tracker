import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { ErrorCode } from '../../../common/constants/error-codes';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';
import type { ApiEnv } from '../../../config/env.validation';
import type { TeamMember } from '../../team/entities/team-member.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import type {
  AccessTokenPayload,
  IssuedTokens,
  SessionContext,
} from '../interfaces/session.interfaces';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Parallel refreshes (e.g. two tabs at boot) within this window are not treated as token theft. */
const ROTATION_GRACE_MS = 10_000;

@Injectable()
export class TokenService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    config: ConfigService<ApiEnv, true>,
  ) {
    this.accessTtlSeconds = config.get('JWT_ACCESS_TTL_SECONDS', {
      infer: true,
    });
    this.refreshTtlMs =
      config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * DAY_MS;
  }

  async issue(
    member: Pick<TeamMember, 'id' | 'email'>,
    context: SessionContext,
    familyId: string = randomUUID(),
  ): Promise<IssuedTokens> {
    const payload: AccessTokenPayload = { sub: member.id, email: member.email };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.refreshTokens.delete({
      memberId: member.id,
      expiresAt: LessThan(new Date()),
    });
    await this.refreshTokens.insert({
      tokenHash: this.hash(refreshToken),
      familyId,
      memberId: member.id,
      expiresAt: refreshTokenExpiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return {
      accessToken,
      expiresIn: this.accessTtlSeconds,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  async rotate(
    presentedToken: string,
    context: SessionContext,
  ): Promise<{ member: TeamMember; tokens: IssuedTokens }> {
    const record = await this.refreshTokens.findOne({
      where: { tokenHash: this.hash(presentedToken) },
      relations: { member: true },
    });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      throw this.invalidRefresh();
    }

    const revokedNow = await this.refreshTokens.update(
      { id: record.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    if (!revokedNow.affected) {
      const revokedAt = record.revokedAt ?? new Date();
      const withinGrace = Date.now() - revokedAt.getTime() < ROTATION_GRACE_MS;
      if (!withinGrace) {
        await this.revokeFamily(record.familyId);
        throw this.invalidRefresh();
      }
    }

    const tokens = await this.issue(record.member, context, record.familyId);
    return { member: record.member, tokens };
  }

  /** Expiring as well as revoking keeps a logged-out token out of the rotation grace window. */
  async revoke(presentedToken: string): Promise<void> {
    const now = new Date();
    await this.refreshTokens.update(
      { tokenHash: this.hash(presentedToken) },
      { revokedAt: now, expiresAt: now },
    );
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      return { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException({
        message: 'Access token is invalid or expired.',
        code: ErrorCode.TokenInvalid,
      });
    }
  }

  private async revokeFamily(familyId: string): Promise<void> {
    const now = new Date();
    await this.refreshTokens.update(
      { familyId },
      { revokedAt: now, expiresAt: now },
    );
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private invalidRefresh(): UnauthorizedException {
    return new UnauthorizedException({
      message: 'Session expired. Please sign in again.',
      code: ErrorCode.RefreshInvalid,
    });
  }
}
