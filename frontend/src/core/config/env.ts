export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  clientId: import.meta.env.VITE_CLIENT_ID ?? 'vortex-web',
} as const;
