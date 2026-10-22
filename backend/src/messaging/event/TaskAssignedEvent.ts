/**
 * Emitted when a task is assigned. Self-contained: the consumer must not
 * need to call back into the tasks service to build a notification.
 */
export class TaskAssignedEvent {
    constructor(
        public readonly taskId: number,
        public readonly taskName: string,
        public readonly assigneeId: number | null,
        public readonly assignedById: number,
    ) {}
}
