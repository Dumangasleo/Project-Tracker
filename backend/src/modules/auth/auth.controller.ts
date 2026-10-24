import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorCode } from '../../common/constants/error-codes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { TeamMember } from '../team/entities/team-member.entity';
import { AUTH_THROTTLE, REFRESH_THROTTLE } from './auth.constants';
import { AuthSessionDto } from './dto/auth-session.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  type AuthSession,
  sessionContextFrom,
} from './interfaces/session.interfaces';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthService } from './services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @ApiOperation({ summary: 'Create an account and start a session' })
  @ApiOkResponse({ type: AuthSessionDto })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionDto> {
    const session = await this.auth.register(dto, sessionContextFrom(request));
    return this.respondWithSession(response, session);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiOkResponse({ type: AuthSessionDto })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionDto> {
    const session = await this.auth.login(dto, sessionContextFrom(request));
    return this.respondWithSession(response, session);
  }

  @Public()
  @Throttle(REFRESH_THROTTLE)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh cookie and issue a new access token',
  })
  @ApiOkResponse({ type: AuthSessionDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionDto> {
    const refreshToken = this.cookies.readRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'No active session.',
        code: ErrorCode.RefreshInvalid,
      });
    }

    try {
      const session = await this.auth.refresh(
        refreshToken,
        sessionContextFrom(request),
      );
      return this.respondWithSession(response, session);
    } catch (error) {
      this.cookies.clearRefreshToken(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiNoContentResponse()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = this.cookies.readRefreshToken(request);
    if (refreshToken) await this.auth.logout(refreshToken);
    this.cookies.clearRefreshToken(response);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the signed-in member profile' })
  @ApiOkResponse({ type: TeamMember })
  me(@CurrentUser() user: AuthUser): Promise<TeamMember> {
    return this.auth.getProfile(user.id);
  }

  private respondWithSession(
    response: Response,
    session: AuthSession,
  ): AuthSessionDto {
    this.cookies.setRefreshToken(
      response,
      session.tokens.refreshToken,
      session.tokens.refreshTokenExpiresAt,
    );
    return AuthSessionDto.from(session);
  }
}
