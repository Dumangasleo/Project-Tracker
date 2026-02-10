<script setup>
import {RouterLink} from "vue-router";

const navItems = [
  { name: 'Dashboard', icon: '📊', to: '/' },
  { name: 'Projects', icon: '📁', to: '/projects' },
  { name: 'Tasks', icon: '✅', to: '/tasks' },
  { name: 'Team', icon: '👥', to: '/team' },
  { name: 'Settings', icon: '⚙️', to: '/settings' },
]
</script>

<template>
  <aside class="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col p-4 text-slate-300">

    <div class="flex items-center gap-3 px-2 mb-10">
      <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
        V
      </div>
      <span class="text-xl font-bold text-white tracking-tight">Vortex Sync</span>
    </div>

    <nav class="flex-1 space-y-1">
      <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
      active-class="bg-slate-800 text-white font-bold border-l-4 border-indigo-500 rounded-l-none"
        >
        <span class="text-lg">{{ item.icon }}</span>
        <span class="font-medium text-slate-200 group-hover::textwhite">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <div class="mt-auto border-t border-slate-800 pt-4 px-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
          👤
        </div>
        <div>
          <p class="text-sm font-bold text-white">ldumangas</p>
          <p class="text-xs text-slate-500">Free Plan</p>
        </div>
      </div>
    </div>

  </aside>
</template>