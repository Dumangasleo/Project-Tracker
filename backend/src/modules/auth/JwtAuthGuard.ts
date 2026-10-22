import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from './Public';
import { JwtPayload } from './JwtPayload';

/**
 * Global guard (registered as APP_GUARD in AuthModule): every HTTP route
 * requires a valid Bearer token unless it is marked @Public().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector,
        private readonly config: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) throw new UnauthorizedException('Missing bearer token');

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
                secret: this.config.get<string>('JWT_SECRET'),
            });
            // Hand the payload to downstream handlers via @CurrentUser().
            request.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractToken(request: {
        headers: { authorization?: string };
    }): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
