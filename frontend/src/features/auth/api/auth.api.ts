import { env } from '@/core/config/env';
import { http } from '@/core/http/http-client';
import type {
  AuthSession,
  LoginCredentials,
  RegistrationData,
  SsoProvider,
} from '../model/auth.types';

const noRefresh = { skipAuthRefresh: true };

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { data } = await http.post<AuthSession>('/auth/login', credentials, noRefresh);
    return data;
  },

  async register(registration: RegistrationData): Promise<AuthSession> {
    const { data } = await http.post<AuthSession>('/auth/register', registration, noRefresh);
    return data;
  },

  async refresh(): Promise<AuthSession> {
    const { data } = await http.post<AuthSession>('/auth/refresh', null, noRefresh);
    return data;
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout', null, noRefresh);
  },

  async ssoProviders(): Promise<SsoProvider[]> {
    const { data } = await http.get<{ providers: SsoProvider[] }>('/auth/sso/providers', noRefresh);
    return data.providers;
  },

  ssoStartUrl(provider: SsoProvider): string {
    return `${env.apiBaseUrl}/auth/sso/${provider}`;
  },
};
