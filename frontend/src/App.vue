<script setup>
import Sidebar from "@/components/Sidebar.vue";
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen bg-slate-950">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>