<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  items: { type: Array as () => any[], default: () => [] },
  loading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  labelKey: { type: String, default: 'name' },
  valueKey: { type: String, default: 'id' },
  placeholder: { type: String, default: 'Select an option...' }
});

const emit = defineEmits(['update:modelValue', 'load-more', 'search']);

const isOpen = ref(false);
const displayValue = ref(''); // What the user sees/types
const dropdownRef = ref<HTMLElement | null>(null);

// When an item is selected from the list
const selectItem = (item: any) => {
  displayValue.value = item[props.labelKey];
  emit('update:modelValue', item[props.valueKey]);
  isOpen.value = false;
};

// Sync display value when modelValue changes (useful for Edits)
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    displayValue.value = '';
    return;
  }
  const found = props.items.find(i => i[props.valueKey] === newVal);
  if (found) displayValue.value = found[props.labelKey];
}, { immediate: true });

// Handle Typing
let searchTimeout: any;
const handleInput = () => {
  isOpen.value = true;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('search', displayValue.value);
  }, 300);
};

const onScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
    if (!props.loading && props.hasMore) emit('load-more');
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
    // Restore the label of the actually selected item if user leaves without picking
    const found = props.items.find(i => i[props.valueKey] === props.modelValue);
    displayValue.value = found ? found[props.labelKey] : '';
  }
};

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));
</script>

<template>
  <div class="relative w-full" ref="dropdownRef">
    <div class="relative">
      <input
          v-model="displayValue"
          type="text"
          :placeholder="placeholder"
          @input="handleInput"
          @focus="isOpen = true"
          class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
      />
      <div class="absolute right-3 top-2.5 flex items-center gap-2">
        <div v-if="loading" class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-slate-500 text-xs">{{ isOpen ? '▲' : '▼' }}</span>
      </div>
    </div>

    <div v-if="isOpen" class="absolute z-100 mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
      <ul class="max-h-60 overflow-y-auto custom-scrollbar" @scroll="onScroll">
        <li
            v-for="item in items"
            :key="item[valueKey]"
            @click="selectItem(item)"
            class="px-4 py-2 cursor-pointer text-sm text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
        >
          {{ item[labelKey] }}
        </li>

        <li v-if="items.length === 0 && !loading" class="px-4 py-3 text-sm text-slate-500 text-center italic">
          No projects found
        </li>
      </ul>
    </div>
  </div>
</template>