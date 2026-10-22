import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/store/notificationStore';

// Lightweight polling. At 50-100 devs this is a single indexed query every
// 30s per open tab — cheap. Swap for websockets later if you need instant push.
const POLL_INTERVAL_MS = 30000;

export function useNotification() {
    const store = useNotificationStore();
    const { items, loading, unreadCount } = storeToRefs(store);

    let timer = null;

    const start = () => {
        store.fetchNotifications();
        timer = setInterval(() => store.fetchNotifications(), POLL_INTERVAL_MS);
    };

    const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
    };

    onMounted(start);
    onUnmounted(stop);

    return {
        items,
        loading,
        unreadCount,
        markAsRead: store.markAsRead,
        markAllRead: store.markAllRead,
        refresh: store.fetchNotifications,
    };
}
