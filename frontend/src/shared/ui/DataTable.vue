<script setup lang="ts" generic="T extends { id: number | string }">
import { onBeforeUnmount, ref, watch } from 'vue';
import BaseSkeleton from './BaseSkeleton.vue';
import type { TableColumn } from './types';

const props = defineProps<{
  columns: TableColumn[];
  rows: T[];
  loading?: boolean;
  hasMore?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{ 'load-more': [] }>();

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

watch(
  sentinel,
  (element) => {
    observer?.disconnect();
    if (!element) return;
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && props.hasMore && !props.loading && !props.error) {
          emit('load-more');
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
  },
  { flush: 'post' },
);

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="border-b border-line bg-surface-muted/60">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="['px-4 py-3 text-xs font-medium tracking-wide text-fg-muted', column.class]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="row in rows" :key="row.id" class="transition-colors hover:bg-surface-muted/50">
            <td v-for="column in columns" :key="column.key" :class="['px-4 py-3 align-middle', column.class]">
              <slot :name="`cell-${column.key}`" :row="row">
                <span class="text-fg">{{ (row as Record<string, unknown>)[column.key] }}</span>
              </slot>
            </td>
          </tr>

          <template v-if="loading">
            <tr v-for="n in rows.length === 0 ? 6 : 2" :key="`skeleton-${n}`">
              <td v-for="column in columns" :key="column.key" class="px-4 py-3.5">
                <BaseSkeleton class="h-4 w-3/4" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && rows.length === 0 && !error">
      <slot name="empty" />
    </div>
    <p v-if="error" class="border-t border-line px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    <div ref="sentinel" class="h-px" aria-hidden="true" />
  </div>
</template>
