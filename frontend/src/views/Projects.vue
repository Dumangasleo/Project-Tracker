<script setup>
import {ref, onMounted} from "vue";
import api from '../plugins/axios';

const projects = ref([])
onMounted(async () => {
  const res = await api.get('/dashboard/projects');
  projects.value = res.data;
})
</script>


<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-white mb-6">Project Management</h1>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-800/50 text-slate-400 text-sm">
        <tr>
          <th class="p-4">Project Name</th>
          <th class="p-4">Status</th>
          <th class="p-4">Team Lead</th>
          <th class="p-4">Priority</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
        <tr v-for="project in projects" :key="project.id" class="hover:bg-slate-800/30">
          <td class="p-4 text-white font-medium">{{ project.name }}</td>
          <td class="p-4">
              <span class="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">
                {{ project.status }}
              </span>
          </td>
          <td class="p-4 text-slate-400">{{ project.lead }}</td>
          <td class="p-4 text-slate-400">{{ project.priority }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>

</style>