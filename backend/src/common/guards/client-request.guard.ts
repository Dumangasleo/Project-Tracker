import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { ApiEnv } from '../../config/env.validation';
import { ErrorCode } from '../constants/error-codes';
import { HttpHeader } from '../constants/http-headers';
import { SKIP_CLIENT_CHECK_KEY } from '../decorators/skip-client-check.decorator';

@Injectable()
export class ClientRequestGuard implements CanActivate {
  private readonly allowedClients: ReadonlySet<string>;
  private readonly toleranceMs: number;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService<ApiEnv, true>,
  ) {
    this.allowedClients = new Set(
      config
        .get('ALLOWED_CLIENT_IDS', { infer: true })
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    );
    this.toleranceMs =
      config.get('CLIENT_TIMESTAMP_TOLERANCE_SEC', { infer: true }) * 1000;
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_CLIENT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const clientId = request.header(HttpHeader.ClientId);
    if (!clientId || !this.allowedClients.has(clientId)) {
      throw new ForbiddenException({
        message: 'Unknown or missing client identifier.',
        code: ErrorCode.ClientUnknown,
      });
    }

    const timestamp = Number(request.header(HttpHeader.ClientTimestamp));
    if (
      !Number.isFinite(timestamp) ||
      Math.abs(Date.now() - timestamp) > this.toleranceMs
    ) {
      throw new BadRequestException({
        message: 'Request timestamp is missing or outside the allowed window.',
        code: ErrorCode.ClockSkew,
      });
    }

    return true;
  }
}
