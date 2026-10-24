<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

defineProps<{ message: string }>();
</script>

<template>
  <div
    role="alert"
    class="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
  >
    <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <span>{{ message }}</span>
  </div>
</template>
