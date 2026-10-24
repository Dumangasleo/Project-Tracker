<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next';
import { ref } from 'vue';
import { useToast } from '@/shared/composables/useToast';
import { controlClass } from '@/shared/ui/control-classes';

const props = defineProps<{ value: string; label: string }>();

const toast = useToast();
const copied = ref(false);

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    toast.error('Could not copy', 'Select the text and copy it manually.');
  }
}
</script>

<template>
  <div class="relative">
    <input
      :value="value"
      :aria-label="label"
      readonly
      :class="[controlClass, 'h-10 border-line pr-11 font-mono text-xs']"
      @focus="($event.target as HTMLInputElement).select()"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-1.5 my-auto flex size-8 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
      :aria-label="`Copy ${label}`"
      @click="copy"
    >
      <Check v-if="copied" class="size-4 text-emerald-600" />
      <Copy v-else class="size-4" />
    </button>
  </div>
</template>
