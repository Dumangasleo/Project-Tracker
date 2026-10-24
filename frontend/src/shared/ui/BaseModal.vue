<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';

const open = defineModel<boolean>('open', { required: true });
withDefaults(
  defineProps<{ title: string; description?: string; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md' },
);

const panel = ref<HTMLElement | null>(null);
const titleId = useId();
let previouslyFocused: HTMLElement | null = null;

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

function close(): void {
  open.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close();
}

watch(open, async (isOpen) => {
  if (isOpen) {
    previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    panel.value
      ?.querySelector<HTMLElement>('input, select, textarea, button:not([data-modal-close])')
      ?.focus();
  } else {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    previouslyFocused?.focus();
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        @mousedown.self="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :class="[
            'flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-elevated shadow-2xl sm:rounded-2xl',
            widths[size],
          ]"
        >
          <header class="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div>
              <h2 :id="titleId" class="text-base font-semibold text-fg">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-sm text-fg-muted">{{ description }}</p>
            </div>
            <button
              type="button"
              data-modal-close
              class="-mr-2 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
              aria-label="Close"
              @click="close"
            >
              <X class="size-4" />
            </button>
          </header>
          <div class="overflow-y-auto px-6 pb-2">
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="mt-2 flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-end"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
