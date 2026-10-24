import axios, { AxiosHeaders, type AxiosError, type AxiosResponse } from 'axios';
import { env } from '@/core/config/env';
import type { ApiErrorBody } from './api-error';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Auth endpoints opt out so a failed login or refresh never triggers another refresh. */
    skipAuthRefresh?: boolean;
    _authRetried?: boolean;
    _clockRetried?: boolean;
  }
}

export interface AuthBridge {
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string | null>;
  onSessionExpired(): void;
}

const Header = {
  ClientId: 'X-Client-Id',
  ClientTimestamp: 'X-Client-Timestamp',
  RequestId: 'X-Request-Id',
  ServerTimestamp: 'x-server-timestamp',
} as const;

let authBridge: AuthBridge | null = null;
let serverClockOffsetMs = 0;

export function connectAuth(bridge: AuthBridge): void {
  authBridge = bridge;
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set(Header.ClientId, env.clientId);
  headers.set(Header.ClientTimestamp, String(Date.now() + serverClockOffsetMs));
  headers.set(Header.RequestId, newRequestId());

  const token = authBridge?.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else headers.delete('Authorization');

  config.headers = headers;
  return config;
});

http.interceptors.response.use(
  (response) => {
    syncServerClock(response);
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config;
    const response = error.response;
    if (response) syncServerClock(response);
    if (!config || !response) throw error;

    if (response.data?.code === 'CLOCK_SKEW' && !config._clockRetried) {
      config._clockRetried = true;
      return http(config);
    }

    if (response.status === 401 && !config.skipAuthRefresh && !config._authRetried && authBridge) {
      config._authRetried = true;
      const token = await authBridge.refreshAccessToken();
      if (token) return http(config);
      authBridge.onSessionExpired();
    }

    throw error;
  },
);

function syncServerClock(response: AxiosResponse): void {
  const serverTime = Number(response.headers[Header.ServerTimestamp]);
  if (Number.isFinite(serverTime) && serverTime > 0) {
    serverClockOffsetMs = serverTime - Date.now();
  }
}

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`;
}
