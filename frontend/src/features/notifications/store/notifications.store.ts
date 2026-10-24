import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { notificationsApi } from '../api/notifications.api';
import type { AppNotification } from '../model/notification.types';

const POLL_INTERVAL_MS = 30_000;

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([]);
  const loaded = ref(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const unreadCount = computed(() => items.value.filter((item) => !item.isRead).length);

  async function refresh(): Promise<void> {
    if (document.visibilityState === 'hidden') return;
    try {
      items.value = await notificationsApi.list();
      loaded.value = true;
    } catch {
      // Polling is best-effort; the next tick retries.
    }
  }

  function startPolling(): void {
    stopPolling();
    void refresh();
    timer = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', refresh);
  }

  function stopPolling(): void {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', refresh);
  }

  async function markAsRead(id: number): Promise<void> {
    const item = items.value.find((notification) => notification.id === id);
    if (!item || item.isRead) return;
    item.isRead = true;
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      item.isRead = false;
    }
  }

  async function markAllRead(): Promise<void> {
    const unread = items.value.filter((item) => !item.isRead);
    unread.forEach((item) => (item.isRead = true));
    try {
      await notificationsApi.markAllRead();
    } catch {
      unread.forEach((item) => (item.isRead = false));
    }
  }

  return { items, loaded, unreadCount, startPolling, stopPolling, markAsRead, markAllRead };
});
