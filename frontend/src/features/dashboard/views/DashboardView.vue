<script setup lang="ts">
import { CalendarCheck, CircleCheck, CircleX, FolderKanban, ListTodo, PartyPopper } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useAuthStore } from '@/features/auth';
import { useToast } from '@/shared/composables/useToast';
import { greeting } from '@/shared/utils/date';
import { dashboardApi } from '../api/dashboard.api';
import StatCard from '../components/StatCard.vue';
import TaskSummaryList from '../components/TaskSummaryList.vue';
import type { DashboardOverview } from '../model/dashboard.types';

const auth = useAuthStore();
const toast = useToast();
const overview = ref<DashboardOverview | null>(null);

const firstName = computed(() => auth.user?.firstName ?? '');

onMounted(async () => {
  try {
    overview.value = await dashboardApi.overview();
  } catch (failure) {
    toast.error('Could not load dashboard', errorMessage(failure));
  }
});
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-fg">
        {{ greeting() }}<template v-if="firstName">, {{ firstName }}</template>
      </h1>
      <p class="mt-1 text-sm text-fg-muted">Here's what's happening across your projects today.</p>
    </header>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
      <StatCard
        label="Active projects"
        :value="overview?.stats.activeProjects ?? null"
        :icon="FolderKanban"
        icon-class="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
      />
      <StatCard
        label="Pending tasks"
        :value="overview?.stats.pendingTasks ?? null"
        :icon="ListTodo"
        icon-class="bg-accent-soft text-accent-fg"
      />
      <StatCard
        label="Completed projects"
        :value="overview?.stats.completedProjects ?? null"
        :icon="CircleCheck"
        icon-class="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
      />
      <StatCard
        label="Failed projects"
        :value="overview?.stats.failedProjects ?? null"
        :icon="CircleX"
        icon-class="bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
      />
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <TaskSummaryList
        title="Upcoming deadlines"
        description="Open tasks sorted by the closest due date."
        :tasks="overview?.upcomingTasks ?? null"
        :empty-icon="PartyPopper"
        empty-title="You're all caught up"
        empty-description="No open tasks with a due date."
        show-due
      />
      <TaskSummaryList
        title="High-priority blockers"
        description="High-priority tasks that haven't started."
        :tasks="overview?.blockers ?? null"
        :empty-icon="CalendarCheck"
        empty-title="All clear"
        empty-description="No critical blockers are holding up your projects."
      />
    </div>
  </div>
</template>
