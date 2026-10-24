<script setup lang="ts">
import type { Component } from 'vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';

defineProps<{
  label: string;
  value: number | null;
  icon: Component;
  iconClass: string;
}>();
</script>

<template>
  <div class="rounded-xl border border-line bg-surface p-5 shadow-xs">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-fg-muted">{{ label }}</p>
      <span :class="['flex size-9 items-center justify-center rounded-lg', iconClass]">
        <component :is="icon" class="size-[18px]" aria-hidden="true" />
      </span>
    </div>
    <BaseSkeleton v-if="value === null" class="mt-3 h-8 w-16" />
    <p v-else class="mt-2 text-3xl font-semibold tracking-tight text-fg tabular-nums">{{ value }}</p>
  </div>
</template>
