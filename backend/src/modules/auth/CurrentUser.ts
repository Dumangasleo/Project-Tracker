import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './JwtPayload';

/**
 * Injects the authenticated user (the JWT payload the guard attached).
 *   findMine(@CurrentUser() user: JwtPayload) { ... user.sub ... }
 *   findMine(@CurrentUser('sub') memberId: number) { ... }
 */
export const CurrentUser = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user: JwtPayload | undefined = request.user;
        return data ? user?.[data] : user;
    },
);
