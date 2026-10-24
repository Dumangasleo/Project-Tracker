import type { Request } from 'express';
import type { TeamMember } from '../../team/entities/team-member.entity';

export interface AccessTokenPayload {
  sub: number;
  email: string;
}

export interface SessionContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface IssuedTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthSession {
  tokens: IssuedTokens;
  member: TeamMember;
}

export function sessionContextFrom(request: Request): SessionContext {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get('user-agent')?.slice(0, 255) ?? null,
  };
}
