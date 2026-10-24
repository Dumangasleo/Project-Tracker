import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { ApiEnv } from '../../config/env.validation';
import { Position } from '../team/entities/position.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { AuthController } from './auth.controller';
import { JWT_AUDIENCE, JWT_ISSUER } from './auth.constants';
import { ExternalIdentity } from './entities/external-identity.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SsoController } from './sso/sso.controller';
import { SsoService } from './sso/sso.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamMember,
      Position,
      RefreshToken,
      ExternalIdentity,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<ApiEnv, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          expiresIn: config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
      }),
    }),
  ],
  controllers: [AuthController, SsoController],
  providers: [
    AuthService,
    TokenService,
    AuthCookieService,
    SsoService,
    JwtAuthGuard,
  ],
  exports: [TokenService, JwtAuthGuard],
})
export class AuthModule {}
