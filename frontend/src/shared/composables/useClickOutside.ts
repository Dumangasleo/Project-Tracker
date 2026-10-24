import { onBeforeUnmount, onMounted, type Ref } from 'vue';

export function useClickOutside(
  targets: Ref<HTMLElement | null>[],
  handler: (event: PointerEvent) => void,
): void {
  const listener = (event: PointerEvent) => {
    const path = event.composedPath();
    if (targets.every((target) => !target.value || !path.includes(target.value))) {
      handler(event);
    }
  };

  onMounted(() => document.addEventListener('pointerdown', listener, true));
  onBeforeUnmount(() => document.removeEventListener('pointerdown', listener, true));
}
