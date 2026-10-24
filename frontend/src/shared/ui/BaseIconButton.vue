<script setup lang="ts">
withDefaults(defineProps<{ label: string; size?: 'sm' | 'md' }>(), { size: 'md' });
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg',
      'focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none',
      size === 'sm' ? 'size-8' : 'size-9',
    ]"
  >
    <slot />
  </button>
</template>
