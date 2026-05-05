<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  // Base Vaadin-like variants
  variant: {
    type: String as () => 'primary' | 'secondary' | 'tertiary' | 'danger',
    default: 'primary'
  },
  // Custom color overrides (accepts hex codes, rgb, or standard CSS color names)
  bgColor: { type: String, default: null },
  textColor: { type: String, default: null },

  // States
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
});

// Explicitly define the events this component emits
const emit = defineEmits(['click']);

// Default Tailwind classes based on the chosen variant
const variantClasses = computed(() => {
  if (props.bgColor) return '';

  switch (props.variant) {
    case 'primary':
      return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border border-transparent focus:ring-indigo-500';
    case 'secondary':
      return 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500';
    case 'tertiary':
      return 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent focus:ring-slate-500';
    case 'danger':
      return 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 focus:ring-red-500';
    default:
      return '';
  }
});

// Apply inline styles ONLY if the user explicitly passes custom colors
const customStyles = computed(() => {
  return {
    backgroundColor: props.bgColor || undefined,
    color: props.textColor || undefined,
    borderColor: props.bgColor ? 'transparent' : undefined
  };
});

// Single handler for both mouse clicks and keyboard 'Enter' presses
const handleClick = (event: Event) => {

  if (props.disabled || props.loading) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  // If safe, emit the click event up to the parent component
  emit('click', event);
};
</script>

<template>
  <button
      :class="[
      'relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses
    ]"
      :style="customStyles"
      :disabled="disabled || loading"
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
  >
    <svg v-if="loading" class="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <slot></slot>
  </button>
</template>