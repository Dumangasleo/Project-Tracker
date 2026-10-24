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
import { PASSWORD_HINT, PASSWORD_RULE } from '../model/auth.constants';
import { useAuthStore } from '../store/auth.store';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = reactive({ firstName: '', lastName: '', email: '', password: '' });
const touchedPassword = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
const redirect = computed(() => safeRedirect(route.query.redirect));

const passwordError = computed(() =>
  touchedPassword.value && !PASSWORD_RULE.test(form.password) ? PASSWORD_HINT : null,
);
const canSubmit = computed(
  () =>
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    PASSWORD_RULE.test(form.password),
);

async function submit(): Promise<void> {
  touchedPassword.value = true;
  if (!canSubmit.value) return;

  error.value = null;
  submitting.value = true;
  try {
    await auth.register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    });
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
      <h1 class="text-2xl font-semibold tracking-tight text-fg">Create your account</h1>
      <p class="mt-1.5 text-sm text-fg-muted">Join your team's workspace in under a minute.</p>
    </div>

    <AuthAlert v-if="error" :message="error" />

    <SsoButtons action="Sign up" :redirect="redirect" />

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseField v-slot="{ id }" label="First name">
          <BaseInput :id="id" v-model="form.firstName" autocomplete="given-name" maxlength="50" required />
        </BaseField>
        <BaseField v-slot="{ id }" label="Last name">
          <BaseInput :id="id" v-model="form.lastName" autocomplete="family-name" maxlength="50" required />
        </BaseField>
      </div>

      <BaseField v-slot="{ id }" label="Work email">
        <BaseInput
          :id="id"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
          required
        />
      </BaseField>

      <BaseField v-slot="{ id, invalid }" label="Password" :hint="PASSWORD_HINT" :error="passwordError">
        <PasswordInput
          :id="id"
          v-model="form.password"
          :invalid="invalid"
          autocomplete="new-password"
          required
          @blur="touchedPassword = true"
        />
      </BaseField>

      <BaseButton type="submit" size="lg" block :loading="submitting" :disabled="!canSubmit">
        Create account
      </BaseButton>
    </form>

    <p class="text-center text-sm text-fg-muted">
      Already have an account?
      <RouterLink
        :to="{ name: 'login', query: route.query.redirect ? { redirect } : {} }"
        class="font-medium text-accent-fg hover:underline"
      >
        Sign in
      </RouterLink>
    </p>
  </div>
</template>
