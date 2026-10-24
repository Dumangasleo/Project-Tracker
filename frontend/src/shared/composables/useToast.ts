import { readonly, ref } from 'vue';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const DISMISS_AFTER_MS = 4_500;
const toasts = ref<Toast[]>([]);
let nextId = 1;

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

function show(tone: ToastTone, title: string, description?: string): void {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, tone, title, description }].slice(-4);
  setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    success: (title: string, description?: string) => show('success', title, description),
    error: (title: string, description?: string) => show('error', title, description),
    info: (title: string, description?: string) => show('info', title, description),
  };
}
