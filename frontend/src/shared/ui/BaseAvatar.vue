<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ name: string; size?: 'xs' | 'sm' | 'md' | 'lg' }>(), {
  size: 'md',
});

const palette = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
];

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
};

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?',
);

const color = computed(() => {
  const hash = [...props.name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
});
</script>

<template>
  <span
    :class="['inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], color]"
    :aria-label="name"
    role="img"
  >
    {{ initials }}
  </span>
</template>
