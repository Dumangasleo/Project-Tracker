import type { Pinia } from 'pinia';
import type { Router } from 'vue-router';
import { connectAuth } from '@/core/http/http-client';
import { useAuthStore } from '@/features/auth';

/** Wires the auth store into the HTTP layer without the core layer importing a feature. */
export function setupHttpAuth(pinia: Pinia, router: Router): void {
  const auth = useAuthStore(pinia);

  connectAuth({
    getAccessToken: () => auth.accessToken,
    refreshAccessToken: () => auth.refreshAccessToken(),
    onSessionExpired: () => {
      auth.clear();
      const current = router.currentRoute.value;
      if (current.meta.requiresAuth) {
        void router.replace({ name: 'login', query: { redirect: current.fullPath } });
      }
    },
  });
}
