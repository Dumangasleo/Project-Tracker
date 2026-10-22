import { defineStore } from 'pinia';
import api from '@/plugins/axios';

// The member is now taken from the JWT on the backend — no client-supplied id.
export const useNotificationStore = defineStore('notification', {
    state: () => ({
        items: [],
        loading: false,
    }),

    getters: {
        unreadCount: (state) => state.items.filter((n) => !n.IsRead).length,
    },

    actions: {
        async fetchNotifications() {
            this.loading = true;
            try {
                const res = await api.get('/notifications');
                this.items = res.data;
            } catch (err) {
                console.error('Error loading notifications:', err);
            } finally {
                this.loading = false;
            }
        },

        async markAsRead(id) {
            // Optimistic update, rollback if the request fails.
            const item = this.items.find((n) => n.id === id);
            if (!item || item.IsRead) return;

            item.IsRead = true;
            try {
                await api.patch(`/notifications/${id}/read`);
            } catch (err) {
                console.error('Error marking notification read:', err);
                item.IsRead = false;
            }
        },

        async markAllRead() {
            const snapshot = this.items.map((n) => ({ id: n.id, IsRead: n.IsRead }));
            this.items.forEach((n) => (n.IsRead = true));
            try {
                await api.patch('/notifications/read-all');
            } catch (err) {
                console.error('Error marking all read:', err);
                snapshot.forEach((prev) => {
                    const item = this.items.find((n) => n.id === prev.id);
                    if (item) item.IsRead = prev.IsRead;
                });
            }
        },
    },
});
