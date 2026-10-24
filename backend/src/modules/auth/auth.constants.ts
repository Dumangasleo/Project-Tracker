export const REFRESH_COOKIE = 'vx_rt';
export const OAUTH_STATE_COOKIE = 'vx_oauth';

export const AUTH_COOKIE_PATH = '/api/v1/auth';
export const SSO_COOKIE_PATH = '/api/v1/auth/sso';

export const JWT_ISSUER = 'vortex-sync-api';
export const JWT_AUDIENCE = 'vortex-sync-web';
export const SSO_STATE_AUDIENCE = 'vortex-sync-sso-state';

export const BCRYPT_ROUNDS = 12;

export const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };
export const REFRESH_THROTTLE = { default: { limit: 30, ttl: 60_000 } };
