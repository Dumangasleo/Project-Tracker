<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import type { Component } from 'vue';
import { RouterLink } from 'vue-router';
import { PRIORITY_OPTIONS } from '@/shared/constants/priority';
import { findOption } from '@/shared/types/tone';
import { dueStatus } from '@/shared/utils/date';
import BaseBadge from '@/shared/ui/BaseBadge.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';
import type { DashboardTask } from '../model/dashboard.types';

defineProps<{
  title: string;
  description: string;
  tasks: DashboardTask[] | null;
  emptyIcon: Component;
  emptyTitle: string;
  emptyDescription: string;
  showDue?: boolean;
}>();

const priorityDot: Record<number, string> = {
  1: 'bg-emerald-500',
  2: 'bg-amber-500',
  3: 'bg-red-500',
};
</script>

<template>
  <BaseCard :title="title" :description="description" flush>
    <template #actions>
      <RouterLink
        to="/tasks"
        class="inline-flex items-center gap-1 text-sm font-medium text-accent-fg hover:underline"
      >
        View all
        <ArrowRight class="size-3.5" aria-hidden="true" />
      </RouterLink>
    </template>

    <ul v-if="tasks === null" class="divide-y divide-line">
      <li v-for="n in 3" :key="n" class="flex items-center gap-3 px-5 py-4">
        <BaseSkeleton class="size-2 rounded-full" />
        <div class="flex-1 space-y-2">
          <BaseSkeleton class="h-4 w-1/2" />
          <BaseSkeleton class="h-3 w-3/4" />
        </div>
      </li>
    </ul>

    <BaseEmptyState v-else-if="tasks.length === 0" :icon="emptyIcon" :title="emptyTitle" :description="emptyDescription" />

    <ul v-else class="divide-y divide-line">
      <li v-for="task in tasks" :key="task.id">
        <RouterLink
          to="/tasks"
          class="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted/60"
        >
          <span
            :class="['size-2 shrink-0 rounded-full', priorityDot[task.priority] ?? 'bg-zinc-400']"
            :title="`${findOption(PRIORITY_OPTIONS, task.priority)?.label ?? ''} priority`"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-fg">{{ task.name }}</span>
            <span class="block truncate text-xs text-fg-muted">{{ task.description || 'No description' }}</span>
          </span>
          <BaseBadge v-if="showDue" :tone="dueStatus(task.dueDate).tone">{{ dueStatus(task.dueDate).label }}</BaseBadge>
        </RouterLink>
      </li>
    </ul>
  </BaseCard>
</template>
