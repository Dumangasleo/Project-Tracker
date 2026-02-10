<script setup>
import { ref, onMounted } from 'vue';
import api from '@/plugins/axios';

const tasks = ref([]);
const loading = ref(true);

const fetchTasks = async () => {
  try {
    const response = await api.get('/tasks');
    tasks.value = response.data;
  } catch (error) {
    console.error("Failed to load tasks:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTasks);

const getPriorityColor = (priority) => {
  if (priority === 'high') return 'text-red-400 bg-red-400/10';
  if (priority === 'medium') return 'text-amber-400 bg-amber-400/10';
  return 'text-emerald-400 bg-emerald-400/10';
};
</script>

<template>
  <div class="p-8">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white">Tasks Management</h1>
        <p class="text-slate-400">Keep track of your team's daily objectives.</p>
      </div>
      <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
        + New Task
      </button>
    </header>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-800/50 text-slate-400 text-sm uppercase">
        <tr>
          <th class="px-6 py-4 font-medium">Task Name</th>
          <th class="px-6 py-4 font-medium">Status</th>
          <th class="px-6 py-4 font-medium">Priority</th>
          <th class="px-6 py-4 font-medium">Due Date</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
        <tr v-for="task in tasks" :key="task.id" class="hover:bg-slate-800/30 transition-colors">
          <td class="px-6 py-4">
            <p class="text-white font-medium">{{ task.title }}</p>
            <p class="text-slate-500 text-sm">{{ task.description }}</p>
          </td>
          <td class="px-6 py-4">
              <span class="px-2 py-1 rounded text-xs font-bold uppercase bg-slate-800 text-slate-300">
                {{ task.status }}
              </span>
          </td>
          <td class="px-6 py-4">
              <span :class="['px-2 py-1 rounded text-xs font-bold uppercase', getPriorityColor(task.priority)]">
                {{ task.priority }}
              </span>
          </td>
          <td class="px-6 py-4 text-slate-400 text-sm">
            {{ task.dueDate }}
          </td>
        </tr>
        <tr v-if="tasks.length === 0 && !loading">
          <td colspan="4" class="px-6 py-10 text-center text-slate-500">
            No tasks found. Start by creating one!
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>