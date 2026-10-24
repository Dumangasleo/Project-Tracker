<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { authApi } from '../api/auth.api';
import { POST_LOGIN_REDIRECT_KEY } from '../model/auth.constants';
import type { SsoProvider } from '../model/auth.types';

const props = defineProps<{ action: 'Sign in' | 'Sign up'; redirect?: string }>();

const providers = ref<SsoProvider[]>([]);
const pending = ref<SsoProvider | null>(null);

const labels: Record<SsoProvider, string> = { google: 'Google', microsoft: 'Microsoft' };

onMounted(async () => {
  try {
    providers.value = await authApi.ssoProviders();
  } catch {
    providers.value = [];
  }
});

function start(provider: SsoProvider): void {
  pending.value = provider;
  try {
    if (props.redirect) sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, props.redirect);
  } catch {
    // Without storage the user simply lands on the dashboard after sign-in.
  }
  window.location.assign(authApi.ssoStartUrl(provider));
}
</script>

<template>
  <div v-if="providers.length > 0" class="space-y-3">
    <div class="grid gap-2" :class="providers.length > 1 ? 'sm:grid-cols-2' : ''">
      <button
        v-for="provider in providers"
        :key="provider"
        type="button"
        :disabled="pending !== null"
        class="inline-flex h-10 items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg shadow-xs transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-60"
        @click="start(provider)"
      >
        <svg v-if="provider === 'google'" class="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        <svg v-else class="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
          <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
          <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
          <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
        </svg>
        {{ action }} with {{ labels[provider] }}
      </button>
    </div>

    <div class="flex items-center gap-3 text-xs text-fg-subtle">
      <span class="h-px flex-1 bg-line" />
      or continue with email
      <span class="h-px flex-1 bg-line" />
    </div>
  </div>
</template>
