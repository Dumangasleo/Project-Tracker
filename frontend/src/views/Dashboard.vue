<script setup>
import { ref, onMounted } from 'vue';
import api from '../plugins/axios';

const stats = ref({
  activeProjects: 0,
  pendingTasks: 0,
  teamVelocity: '0%',
});

onMounted(async () => {
  try {
    const response = await api.get('/dashboard/stats');
    stats.value = response.data;
  } catch (e) {
    console.error("Error fetching stats:", e);
  }
});
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-white">Dashboard Overview</h1>
      <p class="text-slate-400">Welcome back! Here's what's happening today.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Active Projects</p>
        <h2 class="text-2xl font-bold mt-1 text-white">{{ stats.activeProjects }}</h2>
      </div>
      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Pending Tasks</p>
        <h2 class="text-2xl font-bold mt-1 text-white">{{ stats.pendingTasks }}</h2>
      </div>
      <div class="h-32 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <p class="text-slate-500 text-sm">Team Velocity</p>
        <h2 class="text-2xl font-bold mt-1 text-white">{{ stats.teamVelocity }}</h2>
      </div>
    </div>
  </div>
</template>