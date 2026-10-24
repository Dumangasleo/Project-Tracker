<script setup lang="ts">
import { Copy, GitPullRequest, Hand, ListChecks, Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { errorMessage } from '@/core/http/api-error';
import { useAuthStore } from '@/features/auth';
import { SubmitReviewModal, type ReviewDetail } from '@/features/reviews';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useInfiniteList } from '@/shared/composables/useInfiniteList';
import { useToast } from '@/shared/composables/useToast';
import { PRIORITY_OPTIONS } from '@/shared/constants/priority';
import { fullName } from '@/shared/types/member-ref';
import { findOption } from '@/shared/types/tone';
import { dueStatus } from '@/shared/utils/date';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseBadge from '@/shared/ui/BaseBadge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import DataTable from '@/shared/ui/DataTable.vue';
import DropdownMenu from '@/shared/ui/DropdownMenu.vue';
import PageHeader from '@/shared/ui/PageHeader.vue';
import SegmentedControl from '@/shared/ui/SegmentedControl.vue';
import type { MenuItem, TableColumn } from '@/shared/ui/types';
import { tasksApi } from '../api/tasks.api';
import TaskFormModal from '../components/TaskFormModal.vue';
import {
  TASK_FILTER_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
  TaskStatus,
  taskBranchName,
  taskKey,
  type Task,
  type TaskType,
} from '../model/task.types';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const typeFilter = ref<TaskType | null>(null);
const { items, loading, hasMore, error, loadMore, reload } = useInfiniteList((page) =>
  tasksApi.list({ page, type: typeFilter.value }),
);

const modalOpen = ref(false);
const editing = ref<Task | null>(null);
const claimingId = ref<number | null>(null);
const reviewOpen = ref(false);
const reviewTask = ref<Task | null>(null);

const columns: TableColumn[] = [
  { key: 'name', label: 'Task', class: 'w-[30%]' },
  { key: 'project', label: 'Project' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due' },
  { key: 'creator', label: 'Created by' },
  { key: 'actions', label: '', class: 'w-12 text-right' },
];

onMounted(loadMore);
watch(typeFilter, () => reload());

const canClaim = (task: Task) => task.assigneeId === null && task.createdById !== auth.user?.id;

function openCreate(): void {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(task: Task): void {
  editing.value = task;
  modalOpen.value = true;
}

async function claim(task: Task): Promise<void> {
  const confirmed = await confirm({
    title: 'Take this task?',
    message: `"${task.name}" will be assigned to you.`,
    confirmLabel: 'Take task',
  });
  if (!confirmed) return;

  claimingId.value = task.id;
  try {
    await tasksApi.claim(task.id);
    toast.success('Task assigned to you', task.name);
    await reload();
  } catch (failure) {
    toast.error('Could not take task', errorMessage(failure));
  } finally {
    claimingId.value = null;
  }
}

async function remove(task: Task): Promise<void> {
  const confirmed = await confirm({
    title: 'Delete task?',
    message: `"${task.name}" will be permanently deleted.`,
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!confirmed) return;

  try {
    await tasksApi.remove(task.id);
    toast.success('Task deleted', task.name);
    await reload();
  } catch (failure) {
    toast.error('Could not delete task', errorMessage(failure));
  }
}

const canSubmitReview = (task: Task) =>
  task.assigneeId !== null && task.assigneeId === auth.user?.id && task.status !== TaskStatus.Done;

function openSubmitReview(task: Task): void {
  reviewTask.value = task;
  reviewOpen.value = true;
}

async function onReviewSubmitted(review: ReviewDetail): Promise<void> {
  await router.push({ name: 'review-detail', params: { id: review.id } });
}

async function copyBranchName(task: Task): Promise<void> {
  const branch = taskBranchName(task);
  try {
    await navigator.clipboard.writeText(branch);
    toast.success('Branch name copied', `git checkout -b ${branch}`);
  } catch {
    toast.info('Branch name', branch);
  }
}

function actionsFor(task: Task): MenuItem[] {
  return [
    { label: 'Copy branch name', icon: Copy, onSelect: () => copyBranchName(task) },
    ...(canSubmitReview(task)
      ? [{ label: 'Submit for review', icon: GitPullRequest, onSelect: () => openSubmitReview(task) }]
      : []),
    { label: 'Edit', icon: Pencil, onSelect: () => openEdit(task) },
    { label: 'Delete', icon: Trash2, danger: true, onSelect: () => remove(task) },
  ];
}
</script>

<template>
  <div>
    <PageHeader title="Tasks" description="Keep track of your team's daily objectives.">
      <template #actions>
        <BaseButton @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          New task
        </BaseButton>
      </template>
    </PageHeader>

    <div class="mb-4">
      <SegmentedControl v-model="typeFilter" :options="TASK_FILTER_OPTIONS" label="Filter by task type" />
    </div>

    <DataTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      :has-more="hasMore"
      :error="error"
      @load-more="loadMore"
    >
      <template #cell-name="{ row }">
        <button type="button" class="block max-w-full text-left" @click="openEdit(row)">
          <span class="flex items-center gap-2">
            <span
              class="shrink-0 font-mono text-xs whitespace-nowrap text-fg-subtle"
              :title="`Use ${taskKey(row.id)} in a pull request title or branch`"
            >
              {{ taskKey(row.id) }}
            </span>
            <BaseBadge :tone="findOption(TASK_TYPE_OPTIONS, row.type)?.tone">
              {{ findOption(TASK_TYPE_OPTIONS, row.type)?.label }}
            </BaseBadge>
            <span class="truncate font-medium text-fg hover:text-accent-fg">{{ row.name }}</span>
          </span>
          <span class="mt-0.5 block truncate text-xs text-fg-muted">{{ row.description || 'No description' }}</span>
        </button>
      </template>

      <template #cell-project="{ row }">
        <span class="truncate text-fg-muted">{{ row.project?.name ?? '—' }}</span>
      </template>

      <template #cell-assignee="{ row }">
        <div v-if="row.assignee" class="flex items-center gap-2">
          <BaseAvatar :name="fullName(row.assignee)" size="xs" />
          <span class="truncate text-fg">{{ fullName(row.assignee) }}</span>
        </div>
        <BaseButton
          v-else-if="canClaim(row)"
          size="sm"
          variant="secondary"
          :loading="claimingId === row.id"
          @click="claim(row)"
        >
          <Hand class="size-3.5" aria-hidden="true" />
          Take task
        </BaseButton>
        <span v-else class="text-fg-subtle italic">Awaiting assignee</span>
      </template>

      <template #cell-status="{ row }">
        <div class="flex flex-col items-start gap-1">
          <BaseBadge :tone="findOption(TASK_STATUS_OPTIONS, row.status)?.tone" dot>
            {{ findOption(TASK_STATUS_OPTIONS, row.status)?.label }}
          </BaseBadge>
          <button
            v-if="canSubmitReview(row) && row.status !== TaskStatus.InReview"
            type="button"
            class="inline-flex items-center gap-1 text-xs font-medium text-accent-fg hover:underline"
            @click="openSubmitReview(row)"
          >
            <GitPullRequest class="size-3.5" aria-hidden="true" />
            Submit for review
          </button>
        </div>
      </template>

      <template #cell-priority="{ row }">
        <BaseBadge :tone="findOption(PRIORITY_OPTIONS, row.priority)?.tone">
          {{ findOption(PRIORITY_OPTIONS, row.priority)?.label }}
        </BaseBadge>
      </template>

      <template #cell-dueDate="{ row }">
        <BaseBadge v-if="row.dueDate" :tone="dueStatus(row.dueDate).tone">{{ dueStatus(row.dueDate).label }}</BaseBadge>
        <span v-else class="text-fg-subtle">—</span>
      </template>

      <template #cell-creator="{ row }">
        <span class="truncate text-fg-muted">{{ row.creator ? fullName(row.creator) : 'System' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <DropdownMenu :items="actionsFor(row)" :label="`Actions for ${row.name}`" />
      </template>

      <template #empty>
        <BaseEmptyState
          :icon="ListChecks"
          :title="typeFilter === null ? 'No tasks yet' : 'No tasks of this type'"
          description="Create a task and assign it to a teammate."
        >
          <BaseButton @click="openCreate">
            <Plus class="size-4" aria-hidden="true" />
            New task
          </BaseButton>
        </BaseEmptyState>
      </template>
    </DataTable>

    <TaskFormModal v-model:open="modalOpen" :task="editing" @saved="reload" />
    <SubmitReviewModal v-model:open="reviewOpen" :task="reviewTask" @submitted="onReviewSubmitted" />
  </div>
</template>
