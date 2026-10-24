import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<Request>().user;
    return field ? user?.[field] : user;
  },
);
