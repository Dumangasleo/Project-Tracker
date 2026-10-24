<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next';
import { useToast, type ToastTone } from '@/shared/composables/useToast';

const { toasts, dismiss } = useToast();

const icons = { success: CircleCheck, error: CircleAlert, info: Info };
const iconColors: Record<ToastTone, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-accent',
};
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
    aria-live="polite"
    role="status"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-elevated p-4 shadow-lg"
      >
        <component :is="icons[toast.tone]" :class="['mt-0.5 size-5 shrink-0', iconColors[toast.tone]]" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-fg">{{ toast.title }}</p>
          <p v-if="toast.description" class="mt-0.5 text-sm text-fg-muted">{{ toast.description }}</p>
        </div>
        <button
          type="button"
          class="rounded p-0.5 text-fg-subtle hover:text-fg"
          aria-label="Dismiss"
          @click="dismiss(toast.id)"
        >
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
