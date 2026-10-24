<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { errorMessage } from '@/core/http/api-error';
import { safeRedirect } from '@/shared/utils/safe-redirect';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import AuthAlert from '../components/AuthAlert.vue';
import PasswordInput from '../components/PasswordInput.vue';
import SsoButtons from '../components/SsoButtons.vue';
import { ssoErrorMessage } from '../model/auth.messages';
import { useAuthStore } from '../store/auth.store';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = reactive({ email: '', password: '' });
const submitting = ref(false);
const error = ref<string | null>(ssoErrorMessage(route.query.error));
const redirect = computed(() => safeRedirect(route.query.redirect));

async function submit(): Promise<void> {
  error.value = null;
  submitting.value = true;
  try {
    await auth.login({ email: form.email.trim(), password: form.password });
    await router.replace(redirect.value);
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-fg">Welcome back</h1>
      <p class="mt-1.5 text-sm text-fg-muted">Sign in to your Vortex Sync workspace.</p>
    </div>

    <AuthAlert v-if="error" :message="error" />

    <SsoButtons action="Sign in" :redirect="redirect" />

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <BaseField v-slot="{ id }" label="Email">
        <BaseInput
          :id="id"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
          required
        />
      </BaseField>

      <BaseField v-slot="{ id }" label="Password">
        <PasswordInput :id="id" v-model="form.password" autocomplete="current-password" required />
      </BaseField>

      <BaseButton
        type="submit"
        size="lg"
        block
        :loading="submitting"
        :disabled="!form.email || !form.password"
      >
        Sign in
      </BaseButton>
    </form>

    <p class="text-center text-sm text-fg-muted">
      New to Vortex Sync?
      <RouterLink
        :to="{ name: 'register', query: route.query.redirect ? { redirect } : {} }"
        class="font-medium text-accent-fg hover:underline"
      >
        Create an account
      </RouterLink>
    </p>
  </div>
</template>
