import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ErrorCode } from '../../../common/constants/error-codes';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        message: 'Missing bearer token.',
        code: ErrorCode.TokenMissing,
      });
    }

    request.user = await this.tokens.verifyAccessToken(token);
    return true;
  }
}

function extractBearerToken(request: Request): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}
