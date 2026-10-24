import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { NodeEnv, type ApiEnv } from '../../../config/env.validation';
import {
  AUTH_COOKIE_PATH,
  OAUTH_STATE_COOKIE,
  REFRESH_COOKIE,
  SSO_COOKIE_PATH,
} from '../auth.constants';

const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

@Injectable()
export class AuthCookieService {
  private readonly secure: boolean;

  constructor(config: ConfigService<ApiEnv, true>) {
    this.secure =
      config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;
  }

  readRefreshToken(request: Request): string | undefined {
    return this.read(request, REFRESH_COOKIE);
  }

  setRefreshToken(response: Response, token: string, expiresAt: Date): void {
    response.cookie(REFRESH_COOKIE, token, {
      ...this.refreshOptions(),
      expires: expiresAt,
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie(REFRESH_COOKIE, this.refreshOptions());
  }

  readOAuthState(request: Request): string | undefined {
    return this.read(request, OAUTH_STATE_COOKIE);
  }

  setOAuthState(response: Response, value: string): void {
    response.cookie(OAUTH_STATE_COOKIE, value, {
      ...this.oauthStateOptions(),
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });
  }

  clearOAuthState(response: Response): void {
    response.clearCookie(OAUTH_STATE_COOKIE, this.oauthStateOptions());
  }

  private read(request: Request, name: string): string | undefined {
    const value = (request.cookies as Record<string, unknown> | undefined)?.[
      name
    ];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private refreshOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict',
      path: AUTH_COOKIE_PATH,
    };
  }

  // Lax, because the provider redirects back with a cross-site top-level GET.
  private oauthStateOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: SSO_COOKIE_PATH,
    };
  }
}
