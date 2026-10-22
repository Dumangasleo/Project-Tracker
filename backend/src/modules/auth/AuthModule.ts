import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TeamMember } from '../team/entities/team.entities';
import { Position } from '../team/entities/position.entities';
import { AuthService } from './AuthService';
import { AuthController } from './AuthController';
import { JwtAuthGuard } from './JwtAuthGuard';

@Module({
    imports: [
        TypeOrmModule.forFeature([TeamMember, Position]),
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret:
                    config.get<string>('JWT_SECRET') ??
                    'dev-insecure-secret-change-me',
                signOptions: {
                    // Cast: config values are plain strings; JwtModule types
                    // expiresIn as the ms StringValue union.
                    expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
                        '1d') as unknown as number,
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        // Secure by default: every HTTP route needs a JWT unless marked @Public().
        { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
    exports: [JwtModule],
})
export class AuthModule {}
