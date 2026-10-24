import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ClientRequestGuard } from './client-request.guard';

function contextWith(headers: Record<string, string>): ExecutionContext {
  const request = {
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    getType: () => 'http',
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ClientRequestGuard', () => {
  const config = {
    get: (key: string) =>
      ({
        ALLOWED_CLIENT_IDS: 'vortex-web, vortex-swagger',
        CLIENT_TIMESTAMP_TOLERANCE_SEC: 300,
      })[key],
  } as unknown as ConfigService;

  let reflector: Reflector;
  let guard: ClientRequestGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ClientRequestGuard(reflector, config as never);
  });

  it('accepts a known client with a fresh timestamp', () => {
    const context = contextWith({
      'x-client-id': 'vortex-web',
      'x-client-timestamp': String(Date.now()),
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects an unknown client', () => {
    const context = contextWith({
      'x-client-id': 'evil-app',
      'x-client-timestamp': String(Date.now()),
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects a missing or stale timestamp', () => {
    const stale = contextWith({
      'x-client-id': 'vortex-web',
      'x-client-timestamp': String(Date.now() - 10 * 60 * 1000),
    });
    const missing = contextWith({ 'x-client-id': 'vortex-web' });

    expect(() => guard.canActivate(stale)).toThrow(BadRequestException);
    expect(() => guard.canActivate(missing)).toThrow(BadRequestException);
  });

  it('skips routes marked with @SkipClientCheck()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(guard.canActivate(contextWith({}))).toBe(true);
  });
});
