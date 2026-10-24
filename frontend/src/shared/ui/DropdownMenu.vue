<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { useClickOutside } from '@/shared/composables/useClickOutside';
import type { MenuItem } from './types';

withDefaults(defineProps<{ items: MenuItem[]; label?: string }>(), {
  label: 'Open actions',
});

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const position = ref({ top: 0, left: 0 });

const MENU_WIDTH = 176;

async function toggle(): Promise<void> {
  if (open.value) return close();
  const rect = trigger.value!.getBoundingClientRect();
  position.value = {
    top: rect.bottom + 4,
    left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
  };
  open.value = true;
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);
  await nextTick();
  menu.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
}

function close(): void {
  open.value = false;
  window.removeEventListener('scroll', close, true);
  window.removeEventListener('resize', close);
}

function select(item: MenuItem): void {
  close();
  item.onSelect();
}

function onMenuKeydown(event: KeyboardEvent): void {
  const items = [...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (event.key === 'Escape') {
    close();
    trigger.value?.focus();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    items[(index + 1) % items.length]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    items[(index - 1 + items.length) % items.length]?.focus();
  }
}

useClickOutside([trigger, menu], () => open.value && close());
onBeforeUnmount(close);
</script>

<template>
  <button
    ref="trigger"
    type="button"
    :aria-label="label"
    aria-haspopup="menu"
    :aria-expanded="open"
    class="inline-flex size-8 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
    @click.stop="toggle"
  >
    <Ellipsis class="size-4" />
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      ref="menu"
      role="menu"
      class="fixed z-50 overflow-hidden rounded-lg border border-line bg-elevated p-1 shadow-lg"
      :style="{ top: `${position.top}px`, left: `${position.left}px`, width: `${MENU_WIDTH}px` }"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        role="menuitem"
        :class="[
          'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus:outline-none',
          item.danger
            ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10'
            : 'text-fg hover:bg-surface-muted focus:bg-surface-muted',
        ]"
        @click="select(item)"
      >
        <component :is="item.icon" v-if="item.icon" class="size-4 opacity-80" aria-hidden="true" />
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>
