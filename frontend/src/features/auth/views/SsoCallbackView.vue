<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { safeRedirect } from '@/shared/utils/safe-redirect';
import { POST_LOGIN_REDIRECT_KEY } from '../model/auth.constants';
import { useAuthStore } from '../store/auth.store';

const router = useRouter();
const auth = useAuthStore();

function takeStoredRedirect(): string | null {
  try {
    const value = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return value;
  } catch {
    return null;
  }
}

onMounted(async () => {
  await auth.restoreSession();
  const redirect = safeRedirect(takeStoredRedirect());
  if (auth.isAuthenticated) await router.replace(redirect);
  else await router.replace({ name: 'login', query: { error: 'sso_failed' } });
});
</script>

<template>
  <div class="flex flex-col items-center py-10 text-center" role="status">
    <LoaderCircle class="size-8 animate-spin text-accent" aria-hidden="true" />
    <p class="mt-4 text-sm font-medium text-fg">Signing you in…</p>
    <p class="mt-1 text-sm text-fg-muted">This only takes a moment.</p>
  </div>
</template>
