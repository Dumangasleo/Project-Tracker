import type { AuthUser } from '../interfaces/auth-user.interface';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthUser;
    }
  }
}

export {};
