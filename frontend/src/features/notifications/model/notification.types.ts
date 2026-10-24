export type NotificationType = 'TASK_ASSIGNED' | 'PROJECT_CREATED' | 'MEMBER_REGISTERED' | 'REMINDER';

export interface AppNotification {
  id: number;
  recipientId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}
