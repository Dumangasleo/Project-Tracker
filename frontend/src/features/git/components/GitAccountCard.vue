<script setup lang="ts">
import { ExternalLink, GitBranch } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useAuthStore } from '@/features/auth';
import { useToast } from '@/shared/composables/useToast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';
import { gitApi } from '../api/git.api';
import type { GitAccount, GitServerStatus } from '../model/git.types';

const auth = useAuthStore();
const toast = useToast();

const status = ref<GitServerStatus | null>(null);
const account = ref<GitAccount | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const form = reactive({ username: '', password: '', confirm: '' });

const passwordError = computed(() =>
  form.confirm && form.password !== form.confirm ? 'Passwords do not match.' : null,
);
const canSave = computed(
  () =>
    form.password.length >= 8 &&
    form.password === form.confirm &&
    (account.value !== null || /^[A-Za-z0-9][A-Za-z0-9._-]{1,38}$/.test(form.username)),
);

onMounted(async () => {
  try {
    status.value = await gitApi.status();
    if (status.value.enabled) account.value = await gitApi.getAccount();
    form.username = (auth.user?.email.split('@')[0] ?? '').replace(/[^A-Za-z0-9._-]/g, '-');
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    loading.value = false;
  }
});

async function save(): Promise<void> {
  if (!canSave.value) return;
  saving.value = true;
  error.value = null;
  try {
    const creating = account.value === null;
    account.value = await gitApi.saveAccount({
      username: creating ? form.username.trim() : undefined,
      password: form.password,
    });
    Object.assign(form, { password: '', confirm: '' });
    toast.success(creating ? 'Git account created' : 'Git password changed', `Username: ${account.value.username}`);
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseCard title="Git account" description="Clone, push and open pull requests on the team's own Git server.">
    <div v-if="loading" class="space-y-2">
      <BaseSkeleton class="h-4 w-1/2" />
      <BaseSkeleton class="h-10 w-full" />
    </div>

    <p v-else-if="!status?.enabled" class="rounded-lg bg-surface-muted px-4 py-3 text-sm text-fg-muted">
      The Git server is not set up yet. An admin can start it with
      <code class="font-mono text-xs text-fg">docker compose up -d</code> and
      <code class="font-mono text-xs text-fg">corepack yarn git:setup</code>.
    </p>

    <div v-else class="space-y-5">
      <div v-if="account" class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm">
        <GitBranch class="size-4 text-fg-muted" aria-hidden="true" />
        <span class="text-fg-muted">Signed in to Git as</span>
        <span class="font-mono font-medium text-fg">{{ account.username }}</span>
        <a
          :href="account.webUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-auto inline-flex items-center gap-1 text-accent-fg hover:underline"
        >
          Open Git server
          <ExternalLink class="size-3.5" aria-hidden="true" />
        </a>
      </div>
      <p v-else class="text-sm text-fg-muted">
        Create your Git account once. Use this username and password when VS Code, IntelliJ or WebStorm asks for
        credentials while cloning or pushing.
      </p>

      <form class="grid gap-4 sm:grid-cols-3" novalidate @submit.prevent="save">
        <BaseField v-if="!account" v-slot="{ id }" label="Git username" required>
          <BaseInput :id="id" v-model="form.username" maxlength="39" autocomplete="username" />
        </BaseField>
        <BaseField v-slot="{ id }" :label="account ? 'New Git password' : 'Git password'" hint="At least 8 characters" required>
          <BaseInput :id="id" v-model="form.password" type="password" autocomplete="new-password" />
        </BaseField>
        <BaseField v-slot="{ id, invalid }" label="Confirm password" :error="passwordError" required>
          <BaseInput :id="id" v-model="form.confirm" type="password" autocomplete="new-password" :invalid="invalid" />
        </BaseField>
        <div class="flex items-end sm:col-span-3">
          <BaseButton type="submit" :loading="saving" :disabled="!canSave">
            {{ account ? 'Change Git password' : 'Create Git account' }}
          </BaseButton>
        </div>
      </form>
    </div>

    <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
  </BaseCard>
</template>
