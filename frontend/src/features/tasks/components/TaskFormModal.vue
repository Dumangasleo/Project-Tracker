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
import { tasksApi } from '../api/tasks.api';
import {
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
  emptyTaskForm,
  formToTaskInput,
  taskToForm,
  type Task,
} from '../model/task.types';
import ProjectPicker from './ProjectPicker.vue';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ task: Task | null }>();
const emit = defineEmits<{ saved: [task: Task] }>();

const team = useTeamStore();
const toast = useToast();

const form = reactive(emptyTaskForm());
const saving = ref(false);
const error = ref<string | null>(null);

const isEditing = computed(() => props.task !== null);
const canSave = computed(() => form.name.trim() !== '' && form.projectId !== null);
const assigneeOptions = computed<Option<number | null>[]>(() => [
  { value: null, label: 'Unassigned' },
  ...team.memberOptions,
]);

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, props.task ? taskToForm(props.task) : emptyTaskForm());
  error.value = null;
  void team.fetchMembers();
});

async function save(): Promise<void> {
  if (!canSave.value) return;
  saving.value = true;
  error.value = null;
  try {
    const input = formToTaskInput(form);
    const saved = props.task ? await tasksApi.update(props.task.id, input) : await tasksApi.create(input);
    toast.success(isEditing.value ? 'Task updated' : 'Task created', saved.name);
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
  <BaseModal v-model:open="open" :title="isEditing ? 'Edit task' : 'New task'" size="lg">
    <form id="task-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseField v-slot="{ id }" label="Project" required>
        <ProjectPicker :id="id" v-model="form.projectId" :selected-label="task?.project?.name" />
      </BaseField>

      <BaseField v-slot="{ id }" label="Task name" required>
        <BaseInput :id="id" v-model="form.name" maxlength="255" placeholder="e.g. Build checkout page" autocomplete="off" />
      </BaseField>

      <BaseField v-slot="{ id }" label="Description">
        <BaseTextarea :id="id" v-model="form.description" placeholder="Add context, acceptance criteria or links" />
      </BaseField>

      <div class="grid gap-4 sm:grid-cols-3">
        <BaseField v-slot="{ id }" label="Type">
          <BaseSelect :id="id" v-model="form.type" :options="TASK_TYPE_OPTIONS" />
        </BaseField>
        <BaseField v-slot="{ id }" label="Priority">
          <BaseSelect :id="id" v-model="form.priority" :options="PRIORITY_OPTIONS" />
        </BaseField>
        <BaseField v-slot="{ id }" label="Status">
          <BaseSelect :id="id" v-model="form.status" :options="TASK_STATUS_OPTIONS" />
        </BaseField>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <BaseField v-slot="{ id }" label="Assignee">
          <BaseSelect :id="id" v-model="form.assigneeId" :options="assigneeOptions" />
        </BaseField>
        <BaseField v-slot="{ id }" label="Due date">
          <BaseInput :id="id" v-model="form.dueDate" type="date" />
        </BaseField>
        <BaseField v-slot="{ id }" label="Estimate (hours)">
          <BaseInput :id="id" v-model="form.estimatedHours" type="number" min="0" max="999" step="0.5" />
        </BaseField>
      </div>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="task-form" :loading="saving" :disabled="!canSave">
        {{ isEditing ? 'Save changes' : 'Create task' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
