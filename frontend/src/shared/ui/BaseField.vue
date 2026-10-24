<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
}>();

const id = useId();
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-medium text-fg">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <slot :id="id" :invalid="!!error" :described-by="error || hint ? `${id}-help` : undefined" />
    <p
      v-if="error || hint"
      :id="`${id}-help`"
      :class="['text-xs', error ? 'text-red-600 dark:text-red-400' : 'text-fg-subtle']"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
