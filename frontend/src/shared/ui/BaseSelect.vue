<script setup lang="ts" generic="T extends string | number | null">
import { ChevronDown } from 'lucide-vue-next';
import type { Option } from '@/shared/types/tone';
import { controlBorder, controlClass } from './control-classes';

defineOptions({ inheritAttrs: false });

const model = defineModel<T>();
defineProps<{
  options: readonly Option<T>[];
  placeholder?: string;
  invalid?: boolean;
}>();
</script>

<template>
  <div class="relative">
    <select
      v-model="model"
      v-bind="$attrs"
      :aria-invalid="invalid || undefined"
      :class="[controlClass, controlBorder(invalid), 'h-10 appearance-none pr-9']"
    >
      <option v-if="placeholder" :value="null" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle"
      aria-hidden="true"
    />
  </div>
</template>
