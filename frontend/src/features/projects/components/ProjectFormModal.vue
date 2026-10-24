<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useTeamStore } from '@/features/team';
import { useToast } from '@/shared/composables/useToast';
import { PRIORITY_OPTIONS } from '@/shared/constants/priority';
import type { Option } from '@/shared/types/tone';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import BaseSelect from '@/shared/ui/BaseSelect.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';
import { projectsApi } from '../api/projects.api';
import {
  PROJECT_STATUS_OPTIONS,
  emptyProjectForm,
  formToProjectInput,
  projectToForm,
  type Project,
} from '../model/project.types';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ project: Project | null }>();
const emit = defineEmits<{ saved: [project: Project] }>();

const team = useTeamStore();
const toast = useToast();

const form = reactive(emptyProjectForm());
const saving = ref(false);
const error = ref<string | null>(null);

const isEditing = computed(() => props.project !== null);
const leadOptions = computed<Option<number | null>[]>(() => [
  { value: null, label: 'No lead' },
  ...team.memberOptions,
]);

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, props.project ? projectToForm(props.project) : emptyProjectForm());
  error.value = null;
  void team.fetchMembers();
});

async function save(): Promise<void> {
  if (!form.name.trim()) return;
  saving.value = true;
  error.value = null;
  try {
    const input = formToProjectInput(form);
    const saved = props.project
      ? await projectsApi.update(props.project.id, input)
      : await projectsApi.create(input);
    toast.success(isEditing.value ? 'Project updated' : 'Project created', saved.name);
    emit('saved', saved);
    open.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="isEditing ? 'Edit project' : 'New project'"
    :description="isEditing ? undefined : 'Define a goal and who leads it.'"
  >
    <form id="project-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseField v-slot="{ id }" label="Project name" required>
        <BaseInput :id="id" v-model="form.name" maxlength="255" placeholder="e.g. Customer portal" autocomplete="off" />
      </BaseField>

      <BaseField v-slot="{ id }" label="Description">
        <BaseTextarea :id="id" v-model="form.description" placeholder="What does success look like?" />
      </BaseField>

      <BaseField v-slot="{ id }" label="Project lead">
        <BaseSelect :id="id" v-model="form.leadId" :options="leadOptions" />
      </BaseField>

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseField v-slot="{ id }" label="Status">
          <BaseSelect :id="id" v-model="form.status" :options="PROJECT_STATUS_OPTIONS" />
        </BaseField>
        <BaseField v-slot="{ id }" label="Priority">
          <BaseSelect :id="id" v-model="form.priority" :options="PRIORITY_OPTIONS" />
        </BaseField>
      </div>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="project-form" :loading="saving" :disabled="!form.name.trim()">
        {{ isEditing ? 'Save changes' : 'Create project' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
