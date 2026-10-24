import { http } from '@/core/http/http-client';
import type { AppNotification } from '../model/notification.types';

export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    const { data } = await http.get<AppNotification[]>('/notifications');
    return data;
  },

  async markAsRead(id: number): Promise<void> {
    await http.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await http.patch('/notifications/read-all');
  },
};
