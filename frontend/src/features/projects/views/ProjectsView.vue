<script setup lang="ts">
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useInfiniteList } from '@/shared/composables/useInfiniteList';
import { useToast } from '@/shared/composables/useToast';
import { PRIORITY_OPTIONS } from '@/shared/constants/priority';
import { fullName } from '@/shared/types/member-ref';
import { findOption } from '@/shared/types/tone';
import { formatDate } from '@/shared/utils/date';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseBadge from '@/shared/ui/BaseBadge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import DataTable from '@/shared/ui/DataTable.vue';
import DropdownMenu from '@/shared/ui/DropdownMenu.vue';
import PageHeader from '@/shared/ui/PageHeader.vue';
import type { MenuItem, TableColumn } from '@/shared/ui/types';
import { projectsApi } from '../api/projects.api';
import ProjectFormModal from '../components/ProjectFormModal.vue';
import { PROJECT_STATUS_OPTIONS, type Project } from '../model/project.types';

const toast = useToast();
const { confirm } = useConfirm();
const { items, loading, hasMore, error, loadMore, reload } = useInfiniteList((page) =>
  projectsApi.list({ page }),
);

const modalOpen = ref(false);
const editing = ref<Project | null>(null);

const columns: TableColumn[] = [
  { key: 'name', label: 'Project', class: 'w-[38%]' },
  { key: 'lead', label: 'Lead' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'actions', label: '', class: 'w-12 text-right' },
];

onMounted(loadMore);

function openCreate(): void {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(project: Project): void {
  editing.value = project;
  modalOpen.value = true;
}

async function remove(project: Project): Promise<void> {
  const confirmed = await confirm({
    title: 'Delete project?',
    message: `"${project.name}" will be permanently deleted.`,
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!confirmed) return;

  try {
    await projectsApi.remove(project.id);
    toast.success('Project deleted', project.name);
    await reload();
  } catch (failure) {
    toast.error('Could not delete project', errorMessage(failure));
  }
}

function actionsFor(project: Project): MenuItem[] {
  return [
    { label: 'Edit', icon: Pencil, onSelect: () => openEdit(project) },
    { label: 'Delete', icon: Trash2, danger: true, onSelect: () => remove(project) },
  ];
}
</script>

<template>
  <div>
    <PageHeader title="Projects" description="Plan, track and deliver your team's high-level goals.">
      <template #actions>
        <BaseButton @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          New project
        </BaseButton>
      </template>
    </PageHeader>

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
          <span class="block truncate font-medium text-fg hover:text-accent-fg">{{ row.name }}</span>
          <span class="block truncate text-xs text-fg-muted">{{ row.description || 'No description' }}</span>
        </button>
      </template>

      <template #cell-lead="{ row }">
        <div v-if="row.lead" class="flex items-center gap-2">
          <BaseAvatar :name="fullName(row.lead)" size="xs" />
          <span class="truncate text-fg">{{ fullName(row.lead) }}</span>
        </div>
        <span v-else class="text-fg-subtle">Unassigned</span>
      </template>

      <template #cell-status="{ row }">
        <BaseBadge :tone="findOption(PROJECT_STATUS_OPTIONS, row.status)?.tone" dot>
          {{ findOption(PROJECT_STATUS_OPTIONS, row.status)?.label ?? 'Unknown' }}
        </BaseBadge>
      </template>

      <template #cell-priority="{ row }">
        <BaseBadge :tone="findOption(PRIORITY_OPTIONS, row.priority)?.tone">
          {{ findOption(PRIORITY_OPTIONS, row.priority)?.label ?? '—' }}
        </BaseBadge>
      </template>

      <template #cell-updatedAt="{ row }">
        <span class="text-fg-muted">{{ formatDate(row.updatedAt) }}</span>
      </template>

      <template #cell-actions="{ row }">
        <DropdownMenu :items="actionsFor(row)" :label="`Actions for ${row.name}`" />
      </template>

      <template #empty>
        <BaseEmptyState
          :icon="FolderKanban"
          title="No projects yet"
          description="Create your first project to start organizing work."
        >
          <BaseButton @click="openCreate">
            <Plus class="size-4" aria-hidden="true" />
            New project
          </BaseButton>
        </BaseEmptyState>
      </template>
    </DataTable>

    <ProjectFormModal v-model:open="modalOpen" :project="editing" @saved="reload" />
  </div>
</template>
