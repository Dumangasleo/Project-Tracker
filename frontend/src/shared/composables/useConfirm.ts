import { readonly, ref } from 'vue';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

const pending = ref<PendingConfirm | null>(null);

function settle(confirmed: boolean): void {
  pending.value?.resolve(confirmed);
  pending.value = null;
}

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    pending.value?.resolve(false);
    return new Promise((resolve) => {
      pending.value = { ...options, resolve };
    });
  }

  return { pending: readonly(pending), confirm, settle };
}
