<script setup lang="ts">
import { ChevronsUpDown, LoaderCircle } from 'lucide-vue-next';
import { computed, ref, useId, watch } from 'vue';
import { useClickOutside } from '@/shared/composables/useClickOutside';
import type { Option } from '@/shared/types/tone';
import { debounce } from '@/shared/utils/debounce';
import { controlBorder, controlClass } from './control-classes';

defineOptions({ inheritAttrs: false });

const model = defineModel<number | null>({ required: true });
const props = defineProps<{
  options: Option<number>[];
  /** Label of the current value when it is not in the loaded page of options (e.g. while editing). */
  selectedLabel?: string;
  loading?: boolean;
  hasMore?: boolean;
  placeholder?: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ search: [query: string]; 'load-more': [] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref('');
const activeIndex = ref(-1);
const listId = useId();

const currentLabel = computed(
  () =>
    props.options.find((option) => option.value === model.value)?.label ??
    (model.value != null ? (props.selectedLabel ?? '') : ''),
);

const emitSearch = debounce((value: string) => emit('search', value), 300);

watch(currentLabel, (label) => {
  if (!open.value) query.value = label;
}, { immediate: true });

function openList(): void {
  if (open.value) return;
  open.value = true;
  query.value = '';
  activeIndex.value = -1;
  emitSearch('');
}

function closeList(): void {
  open.value = false;
  query.value = currentLabel.value;
}

function choose(option: Option<number>): void {
  model.value = option.value;
  open.value = false;
  query.value = option.label;
}

function onInput(): void {
  open.value = true;
  activeIndex.value = -1;
  emitSearch(query.value.trim());
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    openList();
    activeIndex.value = Math.min(activeIndex.value + 1, props.options.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (event.key === 'Enter' && open.value) {
    event.preventDefault();
    const option = props.options[activeIndex.value];
    if (option) choose(option);
  } else if (event.key === 'Escape') {
    closeList();
  }
}

function onScroll(event: Event): void {
  const list = event.target as HTMLElement;
  if (list.scrollTop + list.clientHeight >= list.scrollHeight - 24 && props.hasMore && !props.loading) {
    emit('load-more');
  }
}

useClickOutside([root], () => open.value && closeList());
</script>

<template>
  <div ref="root" class="relative">
    <input
      v-model="query"
      v-bind="$attrs"
      type="text"
      role="combobox"
      autocomplete="off"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-invalid="invalid || undefined"
      :placeholder="placeholder"
      :class="[controlClass, controlBorder(invalid), 'h-10 pr-9']"
      @focus="openList"
      @input="onInput"
      @keydown="onKeydown"
    />
    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-fg-subtle">
      <LoaderCircle v-if="loading" class="size-4 animate-spin" />
      <ChevronsUpDown v-else class="size-4" />
    </span>

    <ul
      v-if="open"
      :id="listId"
      role="listbox"
      class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-line bg-elevated p-1 shadow-lg"
      @scroll="onScroll"
    >
      <li
        v-for="(option, index) in options"
        :key="option.value"
        role="option"
        :aria-selected="option.value === model"
        :class="[
          'cursor-pointer rounded-md px-2.5 py-2 text-sm',
          index === activeIndex ? 'bg-surface-muted' : '',
          option.value === model ? 'font-medium text-accent-fg' : 'text-fg',
        ]"
        @mousedown.prevent="choose(option)"
        @mouseenter="activeIndex = index"
      >
        {{ option.label }}
      </li>
      <li v-if="!loading && options.length === 0" class="px-2.5 py-3 text-center text-sm text-fg-subtle">
        No matches found
      </li>
    </ul>
  </div>
</template>
