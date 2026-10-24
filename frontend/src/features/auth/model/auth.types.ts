export interface SessionUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  positionId: number;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export type SsoProvider = 'google' | 'microsoft';
