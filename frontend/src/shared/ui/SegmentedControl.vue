<script setup lang="ts" generic="T extends string | number | null">
import type { Option } from '@/shared/types/tone';

const model = defineModel<T>({ required: true });
defineProps<{ options: readonly Option<T>[]; label: string }>();
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-surface-muted p-1"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :class="[
        'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
        model === option.value
          ? 'bg-surface text-fg shadow-xs ring-1 ring-line'
          : 'text-fg-muted hover:text-fg',
      ]"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
