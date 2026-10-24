<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { ref } from 'vue';
import BaseInput from '@/shared/ui/BaseInput.vue';

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ required: true });
defineProps<{ invalid?: boolean }>();

const visible = ref(false);
</script>

<template>
  <BaseInput v-model="model" v-bind="$attrs" :type="visible ? 'text' : 'password'" :invalid="invalid">
    <template #trailing>
      <button
        type="button"
        class="rounded-md p-1.5 text-fg-subtle transition-colors hover:text-fg"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="size-4" />
        <Eye v-else class="size-4" />
      </button>
    </template>
  </BaseInput>
</template>
