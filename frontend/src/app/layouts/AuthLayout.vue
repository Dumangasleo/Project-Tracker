<script setup lang="ts">
import { CircleCheck } from 'lucide-vue-next';
import { RouterView } from 'vue-router';
import BrandMark from '../components/BrandMark.vue';

const highlights = [
  'Plan projects and assign clear owners',
  'Track tasks from to-do to done',
  'Stay in sync with real-time notifications',
];
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <section
      class="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"
      aria-hidden="true"
    >
      <div
        class="pointer-events-none absolute -top-40 -left-40 size-[36rem] rounded-full bg-indigo-600/30 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -right-32 -bottom-48 size-[30rem] rounded-full bg-violet-600/25 blur-3xl"
      />

      <div class="relative flex items-center gap-2.5">
        <span class="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
          <svg viewBox="0 0 24 24" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 5l8 14 8-14" />
            <path d="M8.5 5L12 11.5 15.5 5" opacity="0.6" />
          </svg>
        </span>
        <span class="text-[15px] font-semibold tracking-tight">Vortex Sync</span>
      </div>

      <div class="relative max-w-md">
        <h2 class="text-3xl leading-tight font-semibold tracking-tight">
          One workspace for every project your team ships.
        </h2>
        <ul class="mt-8 space-y-3 text-sm text-zinc-300">
          <li v-for="item in highlights" :key="item" class="flex items-center gap-3">
            <CircleCheck class="size-5 text-indigo-400" />
            {{ item }}
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-zinc-500">© {{ new Date().getFullYear() }} Vortex Sync</p>
    </section>

    <main class="flex items-center justify-center px-4 py-12 sm:px-6">
      <div class="w-full max-w-sm">
        <div class="mb-8 lg:hidden"><BrandMark /></div>
        <RouterView />
      </div>
    </main>
  </div>
</template>
