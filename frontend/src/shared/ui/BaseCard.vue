<script setup lang="ts">
defineProps<{ title?: string; description?: string; flush?: boolean }>();
</script>

<template>
  <section class="rounded-xl border border-line bg-surface shadow-xs">
    <header
      v-if="title || $slots.actions"
      class="flex items-start justify-between gap-4 border-b border-line px-5 py-4"
    >
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-fg">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-sm text-fg-muted">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div :class="flush ? '' : 'p-5'">
      <slot />
    </div>
  </section>
</template>
