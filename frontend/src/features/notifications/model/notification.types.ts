export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'PROJECT_CREATED'
  | 'MEMBER_REGISTERED'
  | 'REMINDER'
  | 'REVIEW_REQUESTED'
  | 'REVIEW_COMMENT'
  | 'REVIEW_DECISION';

export const REVIEW_NOTIFICATION_TYPES: readonly NotificationType[] = [
  'REVIEW_REQUESTED',
  'REVIEW_COMMENT',
  'REVIEW_DECISION',
];

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
