<script setup>
import { onMounted } from 'vue';
import { useDashboard } from "@/composables/useDashBoard.js";
import { checkTaskUrgency, getPriorityDot } from '@/utils/Formatters';

// 1. Pull in exactly what we need from our new Composable
const {
  fetchDashboardData,
  activeProjectsCount,
  successfulProjectsCount,
  failedProjectsCount,
  pendingTasksCount,
  urgentTasks,
  highPriorityBlockers
} = useDashboard();

// 2. Fetch data on load
onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-white">Dashboard Overview</h1>
      <p class="text-slate-400">Welcome back! Here's what's happening today.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Active Projects</p>
        <h2 class="text-2xl font-bold mt-1 text-white">{{ activeProjectsCount }}</h2>
      </div>

      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Pending Tasks</p>
        <h2 class="text-2xl font-bold mt-1 text-white">{{ pendingTasksCount }}</h2>
      </div>

      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Successful Projects</p>
        <h2 class="text-2xl font-bold mt-1 text-emerald-400">{{ successfulProjectsCount }}</h2>
      </div>

      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Failed Projects</p>
        <h2 class="text-2xl font-bold mt-1 text-red-400">{{ failedProjectsCount }}</h2>
      </div>
    </div>

    <div class="mt-8 bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-red-400">⚡</span> Action Required
          </h2>
          <p class="text-slate-400 text-sm mt-1">Pending tasks sorted by closest due date.</p>
        </div>
        <span class="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/20">
          {{ urgentTasks.length }} Upcoming
        </span>
      </div>

      <div class="divide-y divide-slate-800">
        <div v-if="urgentTasks.length === 0" class="p-12 text-center">
          <span class="text-5xl block mb-4">🎉</span>
          <p class="text-white text-lg font-medium">You're all caught up!</p>
          <p class="text-slate-500 mt-1">No overdue or upcoming tasks to worry about right now.</p>
        </div>

        <div
            v-for="task in urgentTasks"
            :key="task.id"
            class="p-6 hover:bg-slate-800/40 transition-colors flex items-center justify-between group"
        >
          <div class="flex items-start gap-4">
            <div
                class="mt-2 w-3 h-3 rounded-full shrink-0 shadow-md"
                :class="getPriorityDot(task.Priority)"
                title="Task Priority"
            ></div>

            <div>
              <h3 class="text-white font-semibold text-lg group-hover:text-indigo-400 transition-colors">
                {{ task.TaskName }}
              </h3>
              <p class="text-slate-500 text-sm mt-1 truncate max-w-md lg:max-w-2xl">
                {{ task.Description || 'No description provided.' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4 shrink-0">
            <span
                :class="['px-3 py-1 rounded-full text-xs font-bold border tracking-wide', checkTaskUrgency(task.DueDate).color]"
            >
              {{ checkTaskUrgency(task.DueDate).label }}
            </span>

            <button class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <span class="text-xl">→</span>
            </button>
          </div>
        </div> </div>
    </div>

    <div class="mt-8 bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-red-500">🔥</span> High Priority Blockers
          </h2>
          <p class="text-slate-400 text-sm mt-1">High priority tasks that haven't been started.</p>
        </div>
        <span class="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">
          {{ highPriorityBlockers.length }} Critical
        </span>
      </div>

      <div class="divide-y divide-slate-800">
        <div v-if="highPriorityBlockers.length === 0" class="p-12 text-center">
          <span class="text-5xl block mb-4">👍</span>
          <p class="text-white text-lg font-medium">All Clear!</p>
          <p class="text-slate-500 mt-1">No critical blockers holding up your projects.</p>
        </div>

        <div
            v-for="blocker in highPriorityBlockers"
            :key="blocker.id"
            class="p-6 hover:bg-slate-800/40 transition-colors flex items-center justify-between group"
        >
          <div class="flex items-start gap-4">
            <div class="mt-2 w-3 h-3 rounded-full shrink-0 shadow-md bg-red-500 shadow-red-500/50"></div>

            <div>
              <h3 class="text-white font-semibold text-lg group-hover:text-red-400 transition-colors">
                {{ blocker.TaskName }}
              </h3>
              <p class="text-slate-500 text-sm mt-1 truncate max-w-md lg:max-w-2xl">
                {{ blocker.Description || 'Needs immediate attention.' }}
              </p>
            </div>
          </div>

          <button class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
            <span class="text-xl">→</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>