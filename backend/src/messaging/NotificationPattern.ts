/**
 * Event names published to RabbitMQ.
 *
 * Both the producer (main API) and the consumer (notification microservice)
 * import these, so treat them as a stable contract — renaming one is a
 * breaking change across services.
 */
export enum NotificationPattern {
    TASK_ASSIGNED = 'task.assigned',
    PROJECT_CREATED = 'project.created',
    MEMBER_REGISTERED = 'member.registered',
}

/** DI token for the RabbitMQ client proxy used by producers. */
export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';
