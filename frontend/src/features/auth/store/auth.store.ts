import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '../api/auth.api';
import type {
  AuthSession,
  LoginCredentials,
  RegistrationData,
  SessionUser,
} from '../model/auth.types';

const SESSION_CHANNEL = 'vortex-auth';

/** The access token lives only in memory; the refresh token is an httpOnly cookie the browser manages. */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<SessionUser | null>(null);

  const isAuthenticated = computed(() => accessToken.value !== null);
  const displayName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}`.trim() : '',
  );

  let refreshInFlight: Promise<string | null> | null = null;
  let restoreInFlight: Promise<void> | null = null;

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(SESSION_CHANNEL) : null;
  channel?.addEventListener('message', (event: MessageEvent<string>) => {
    if (event.data === 'logout') clear();
  });

  function applySession(session: AuthSession): void {
    accessToken.value = session.accessToken;
    user.value = session.user;
  }

  function clear(): void {
    accessToken.value = null;
    user.value = null;
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    applySession(await authApi.login(credentials));
  }

  async function register(registration: RegistrationData): Promise<void> {
    applySession(await authApi.register(registration));
  }

  function refreshAccessToken(): Promise<string | null> {
    refreshInFlight ??= authApi
      .refresh()
      .then((session) => {
        applySession(session);
        return session.accessToken;
      })
      .catch(() => {
        clear();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  }

  /** Runs once per page load to pick up an existing session from the refresh cookie. */
  function restoreSession(): Promise<void> {
    restoreInFlight ??= refreshAccessToken().then(() => undefined);
    return restoreInFlight;
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      clear();
      channel?.postMessage('logout');
    }
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    displayName,
    login,
    register,
    refreshAccessToken,
    restoreSession,
    logout,
    clear,
  };
});
