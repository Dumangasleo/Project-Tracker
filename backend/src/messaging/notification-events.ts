/** Shared contract between the API (publisher) and the notification worker (consumer). */
export enum NotificationEvent {
  TaskAssigned = 'task.assigned',
  ProjectCreated = 'project.created',
  MemberRegistered = 'member.registered',
  ReviewRequested = 'review.requested',
  ReviewCommented = 'review.commented',
  ReviewDecided = 'review.decided',
}

export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';
export const NOTIFICATION_QUEUE = 'notifications_queue';
