<script setup lang="ts">
import { ExternalLink, GitBranch, Unlink } from 'lucide-vue-next';
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import type { Option } from '@/shared/types/tone';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';
import SegmentedControl from '@/shared/ui/SegmentedControl.vue';
import { gitApi } from '../api/git.api';
import {
  ideLinks,
  slugify,
  type GitServerStatus,
  type ProjectRepository,
  type RepositoryMode,
} from '../model/git.types';
import CopyField from './CopyField.vue';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ project: { id: number; name: string; repository: string | null } | null }>();
const emit = defineEmits<{ changed: [repository: string | null] }>();

const toast = useToast();
const { confirm } = useConfirm();

const status = ref<GitServerStatus | null>(null);
const repository = ref<ProjectRepository | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const form = reactive({ mode: 'create' as RepositoryMode, name: '', fullName: '' });

const modeOptions: Option<RepositoryMode>[] = [
  { value: 'create', label: 'Create new' },
  { value: 'link', label: 'Link existing' },
];

const canSave = computed(() =>
  form.mode === 'create'
    ? /^[A-Za-z0-9._-]{1,100}$/.test(form.name)
    : /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(form.fullName.trim()),
);
const ides = computed(() => (repository.value ? ideLinks(repository.value.cloneUrl) : []));

watch(open, async (isOpen) => {
  if (!isOpen || !props.project) return;
  error.value = null;
  repository.value = null;
  Object.assign(form, { mode: 'create', name: slugify(props.project.name), fullName: '' });
  loading.value = true;
  try {
    status.value = await gitApi.status();
    if (status.value.enabled && props.project.repository) {
      repository.value = await gitApi.getRepository(props.project.id);
    }
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    loading.value = false;
  }
});

async function save(): Promise<void> {
  if (!canSave.value || !props.project) return;
  saving.value = true;
  error.value = null;
  try {
    repository.value = await gitApi.attachRepository(
      props.project.id,
      form.mode === 'create' ? { mode: 'create', name: form.name } : { mode: 'link', fullName: form.fullName.trim() },
    );
    toast.success(form.mode === 'create' ? 'Repository created' : 'Repository linked', repository.value.fullName);
    emit('changed', repository.value.fullName);
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}

async function unlink(): Promise<void> {
  if (!props.project || !repository.value) return;
  const confirmed = await confirm({
    title: 'Unlink repository?',
    message: `${repository.value.fullName} stays on the Git server; it just stops showing on this project.`,
    confirmLabel: 'Unlink',
    danger: true,
  });
  if (!confirmed) return;
  try {
    await gitApi.detachRepository(props.project.id);
    repository.value = null;
    emit('changed', null);
  } catch (failure) {
    toast.error('Could not unlink', errorMessage(failure));
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Repository" :description="project?.name" size="lg">
    <div v-if="loading" class="space-y-3 pb-4">
      <BaseSkeleton class="h-4 w-1/2" />
      <BaseSkeleton class="h-10 w-full" />
      <BaseSkeleton class="h-10 w-full" />
    </div>

    <p v-else-if="status && !status.enabled" class="mb-4 rounded-lg bg-surface-muted px-4 py-3 text-sm text-fg-muted">
      The Git server is not set up yet. An admin can start it with
      <code class="font-mono text-xs text-fg">docker compose up -d</code> and
      <code class="font-mono text-xs text-fg">corepack yarn git:setup</code>.
    </p>

    <div v-else-if="repository" class="space-y-5 pb-4">
      <div class="flex flex-wrap items-center gap-3">
        <GitBranch class="size-4 text-fg-muted" aria-hidden="true" />
        <span class="font-mono text-sm font-medium text-fg">{{ repository.fullName }}</span>
        <span class="text-xs text-fg-subtle">default branch {{ repository.defaultBranch }}</span>
        <a
          :href="repository.htmlUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-auto inline-flex items-center gap-1 text-sm text-accent-fg hover:underline"
        >
          Open on Git server
          <ExternalLink class="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <BaseField label="Clone with HTTP (username + Git password)">
        <CopyField :value="repository.cloneUrl" label="HTTP clone URL" />
      </BaseField>
      <BaseField label="Clone with SSH (after adding your SSH key on the Git server)">
        <CopyField :value="repository.sshUrl" label="SSH clone URL" />
      </BaseField>

      <div>
        <p class="mb-2 text-sm font-medium text-fg">Open in your editor</p>
        <div class="flex flex-wrap gap-2">
          <a
            v-for="ide in ides"
            :key="ide.label"
            :href="ide.href"
            :title="ide.hint"
            class="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg shadow-xs transition-colors hover:bg-surface-muted"
          >
            {{ ide.label }}
          </a>
        </div>
        <p class="mt-2 text-xs text-fg-subtle">
          IntelliJ and WebStorm buttons need JetBrains Toolbox. Without it, use Git → Clone… (Get from VCS) and paste
          the HTTP URL above.
        </p>
      </div>

      <ol class="list-decimal space-y-1 rounded-lg bg-surface-muted py-3 pr-4 pl-8 text-sm text-fg-muted">
        <li>Create your Git account once in <span class="font-medium text-fg">Settings → Git account</span>.</li>
        <li>Clone, then make a branch per task, e.g. <code class="font-mono text-xs text-fg">task/12-checkout-page</code>.</li>
        <li>
          Push and open a pull request with <code class="font-mono text-xs text-fg">T-12</code> in the title or branch.
          It shows up in <span class="font-medium text-fg">Code reviews</span> by itself.
        </li>
        <li>Every push and pull request runs the CI pipeline in <code class="font-mono text-xs text-fg">.gitea/workflows/ci.yml</code>.</li>
      </ol>
    </div>

    <form v-else id="repository-form" class="space-y-4 pb-2" novalidate @submit.prevent="save">
      <SegmentedControl v-model="form.mode" :options="modeOptions" label="Create or link a repository" />
      <BaseField
        v-if="form.mode === 'create'"
        v-slot="{ id }"
        label="Repository name"
        hint="Private repository in the team organization, with a README and a CI pipeline."
        required
      >
        <BaseInput :id="id" v-model="form.name" maxlength="100" autocomplete="off" />
      </BaseField>
      <BaseField v-else v-slot="{ id }" label="Existing repository" hint="As owner/name, e.g. vortex/checkout-web" required>
        <BaseInput :id="id" v-model="form.fullName" maxlength="200" autocomplete="off" />
      </BaseField>
    </form>

    <p v-if="error" class="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>

    <template #footer>
      <BaseButton v-if="repository" variant="ghost" class="sm:mr-auto" @click="unlink">
        <Unlink class="size-4" aria-hidden="true" />
        Unlink
      </BaseButton>
      <BaseButton variant="secondary" @click="open = false">Close</BaseButton>
      <BaseButton
        v-if="!repository && status?.enabled"
        type="submit"
        form="repository-form"
        :loading="saving"
        :disabled="!canSave"
      >
        {{ form.mode === 'create' ? 'Create repository' : 'Link repository' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
