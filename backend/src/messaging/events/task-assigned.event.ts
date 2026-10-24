export class TaskAssignedEvent {
  constructor(
    readonly taskId: number,
    readonly taskName: string,
    readonly assigneeId: number | null,
    readonly assignedById: number,
  ) {}
}
