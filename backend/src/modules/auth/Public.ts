import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as public so the global JwtAuthGuard skips it.
 * Use on login/register and health checks:  @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
