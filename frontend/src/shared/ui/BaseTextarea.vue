<script setup lang="ts">
import { controlBorder, controlClass } from './control-classes';

const model = defineModel<string | null>();
withDefaults(defineProps<{ invalid?: boolean; rows?: number }>(), { rows: 3 });
</script>

<template>
  <textarea
    v-model="model"
    :rows="rows"
    :aria-invalid="invalid || undefined"
    :class="[controlClass, controlBorder(invalid), 'resize-y py-2']"
  />
</template>
