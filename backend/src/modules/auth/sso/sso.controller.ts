import {
  Controller,
  Get,
  Logger,
  Param,
  ParseEnumPipe,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipClientCheck } from '../../../common/decorators/skip-client-check.decorator';
import type { ApiEnv } from '../../../config/env.validation';
import { AUTH_THROTTLE } from '../auth.constants';
import { sessionContextFrom } from '../interfaces/session.interfaces';
import { AuthCookieService } from '../services/auth-cookie.service';
import { SsoProvider } from './sso-provider.enum';
import { SsoError, SsoService } from './sso.service';

const providerPipe = new ParseEnumPipe(SsoProvider);

@ApiTags('Auth')
@Controller('auth/sso')
export class SsoController {
  private readonly logger = new Logger(SsoController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly sso: SsoService,
    private readonly cookies: AuthCookieService,
    config: ConfigService<ApiEnv, true>,
  ) {
    this.frontendUrl = config
      .get('FRONTEND_URL', { infer: true })
      .replace(/\/$/, '');
  }

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'List the SSO providers configured on this server' })
  providers(): { providers: SsoProvider[] } {
    return { providers: this.sso.enabledProviders() };
  }

  @Public()
  @SkipClientCheck()
  @Throttle(AUTH_THROTTLE)
  @Get(':provider')
  @ApiExcludeEndpoint()
  async start(
    @Param('provider', providerPipe) provider: SsoProvider,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const { url, stateToken } =
        await this.sso.createAuthorizationRequest(provider);
      this.cookies.setOAuthState(response, stateToken);
      response.redirect(url);
    } catch (error) {
      this.redirectToLogin(response, error);
    }
  }

  @Public()
  @SkipClientCheck()
  @Get(':provider/callback')
  @ApiExcludeEndpoint()
  async callback(
    @Param('provider', providerPipe) provider: SsoProvider,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const stateToken = this.cookies.readOAuthState(request);
    this.cookies.clearOAuthState(response);

    try {
      const session = await this.sso.completeAuthorization(
        provider,
        { code, state, error },
        stateToken,
        sessionContextFrom(request),
      );
      this.cookies.setRefreshToken(
        response,
        session.tokens.refreshToken,
        session.tokens.refreshTokenExpiresAt,
      );
      response.redirect(`${this.frontendUrl}/auth/callback`);
    } catch (failure) {
      this.redirectToLogin(response, failure);
    }
  }

  private redirectToLogin(response: Response, error: unknown): void {
    const code = error instanceof SsoError ? error.code : 'sso_failed';
    if (!(error instanceof SsoError)) {
      this.logger.error('SSO sign-in failed', (error as Error)?.stack);
    }
    response.redirect(
      `${this.frontendUrl}/login?error=${encodeURIComponent(code)}`,
    );
  }
}
