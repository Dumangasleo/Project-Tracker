<script setup lang="ts">
import { controlBorder, controlClass } from './control-classes';

defineOptions({ inheritAttrs: false });

const model = defineModel<string | number | null>();
defineProps<{ invalid?: boolean }>();
</script>

<template>
  <div class="relative">
    <span
      v-if="$slots.leading"
      class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-subtle"
    >
      <slot name="leading" />
    </span>
    <input
      v-model="model"
      v-bind="$attrs"
      :aria-invalid="invalid || undefined"
      :class="[controlClass, controlBorder(invalid), 'h-10', $slots.leading && 'pl-9', $slots.trailing && 'pr-10']"
    />
    <span v-if="$slots.trailing" class="absolute inset-y-0 right-1.5 flex items-center">
      <slot name="trailing" />
    </span>
  </div>
</template>
