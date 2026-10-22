<script setup>
import { computed } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import Sidebar from "@/components/Sidebar.vue";

const route = useRoute();
// Hide the app shell (sidebar) on public pages like /login.
const showShell = computed(() => !route.meta.public);
</script>

<template>
  <div class="flex min-h-screen bg-slate-950">
    <Sidebar v-if="showShell" />

    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
