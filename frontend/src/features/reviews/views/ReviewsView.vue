<script setup lang="ts">
import { GitPullRequest, MessageSquare } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useInfiniteList } from '@/shared/composables/useInfiniteList';
import { fullName } from '@/shared/types/member-ref';
import { findOption } from '@/shared/types/tone';
import { relativeTime } from '@/shared/utils/date';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseBadge from '@/shared/ui/BaseBadge.vue';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import DataTable from '@/shared/ui/DataTable.vue';
import PageHeader from '@/shared/ui/PageHeader.vue';
import SegmentedControl from '@/shared/ui/SegmentedControl.vue';
import type { TableColumn } from '@/shared/ui/types';
import { reviewsApi } from '../api/reviews.api';
import {
  providerLabel,
  REVIEW_STATUS_OPTIONS,
  SCOPE_OPTIONS,
  SEVERITY_TONES,
  type ReviewListItem,
  type ReviewScope,
  type Severity,
} from '../model/review.types';

const scope = ref<ReviewScope>('to-review');
const { items, loading, hasMore, error, loadMore, reload } = useInfiniteList((page) =>
  reviewsApi.list({ page, scope: scope.value }),
);

const columns: TableColumn[] = [
  { key: 'title', label: 'Pull request', class: 'w-[34%]' },
  { key: 'task', label: 'Task' },
  { key: 'author', label: 'Author' },
  { key: 'reviewers', label: 'Reviewers' },
  { key: 'status', label: 'Status' },
  { key: 'checks', label: 'Checks' },
  { key: 'updatedAt', label: 'Updated', class: 'text-right' },
];

const emptyText: Record<ReviewScope, { title: string; description: string }> = {
  'to-review': {
    title: 'Nothing to review',
    description: 'When a teammate asks you to review their pull request, it shows up here.',
  },
  mine: {
    title: 'No pull requests yet',
    description: 'Finish an assigned task, then use "Submit for review" on the Tasks page.',
  },
  all: { title: 'No reviews yet', description: 'Submitted pull requests will appear here.' },
};

onMounted(loadMore);
watch(scope, () => reload());

function severityCounts(review: ReviewListItem): { severity: Severity; count: number }[] {
  return (['CRITICAL', 'HIGH', 'MEDIUM'] as const)
    .map((severity) => ({ severity, count: review.openFindings[severity] }))
    .filter((entry) => entry.count > 0);
}
</script>

<template>
  <div>
    <PageHeader
      title="Code reviews"
      description="Pull requests from finished tasks, with comments, approvals and automatic checks."
    />

    <div class="mb-4">
      <SegmentedControl v-model="scope" :options="SCOPE_OPTIONS" label="Which reviews to show" />
    </div>

    <DataTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      :has-more="hasMore"
      :error="error"
      @load-more="loadMore"
    >
      <template #cell-title="{ row }">
        <RouterLink :to="{ name: 'review-detail', params: { id: row.id } }" class="block max-w-full">
          <span class="block truncate font-medium text-fg hover:text-accent-fg">{{ row.title }}</span>
          <span class="mt-0.5 block truncate text-xs text-fg-muted">
            {{ providerLabel(row.provider) }} · {{ row.repository }} #{{ row.pullRequestNumber }}
          </span>
        </RouterLink>
      </template>

      <template #cell-task="{ row }">
        <span class="block max-w-48 truncate text-fg-muted">{{ row.task?.name ?? '—' }}</span>
      </template>

      <template #cell-author="{ row }">
        <div v-if="row.author" class="flex items-center gap-2">
          <BaseAvatar :name="fullName(row.author)" size="xs" />
          <span class="truncate text-fg">{{ fullName(row.author) }}</span>
        </div>
      </template>

      <template #cell-reviewers="{ row }">
        <div class="flex -space-x-1.5">
          <BaseAvatar
            v-for="reviewer in row.reviewers"
            :key="reviewer.id"
            :name="reviewer.member ? fullName(reviewer.member) : '?'"
            :title="reviewer.member ? fullName(reviewer.member) : undefined"
            size="xs"
            class="ring-2 ring-surface"
          />
        </div>
      </template>

      <template #cell-status="{ row }">
        <BaseBadge :tone="findOption(REVIEW_STATUS_OPTIONS, row.status)?.tone" dot>
          {{ findOption(REVIEW_STATUS_OPTIONS, row.status)?.label }}
        </BaseBadge>
      </template>

      <template #cell-checks="{ row }">
        <div class="flex flex-wrap items-center gap-1.5">
          <BaseBadge
            v-for="entry in severityCounts(row)"
            :key="entry.severity"
            :tone="SEVERITY_TONES[entry.severity]"
          >
            {{ entry.count }} {{ entry.severity.toLowerCase() }}
          </BaseBadge>
          <span v-if="severityCounts(row).length === 0" class="text-xs text-fg-subtle">No issues</span>
          <span v-if="row.commentCount > 0" class="inline-flex items-center gap-1 text-xs text-fg-muted">
            <MessageSquare class="size-3.5" aria-hidden="true" />
            {{ row.commentCount }}
          </span>
        </div>
      </template>

      <template #cell-updatedAt="{ row }">
        <span class="text-xs whitespace-nowrap text-fg-muted">{{ relativeTime(row.updatedAt) }}</span>
      </template>

      <template #empty>
        <BaseEmptyState :icon="GitPullRequest" :title="emptyText[scope].title" :description="emptyText[scope].description" />
      </template>
    </DataTable>
  </div>
</template>
