export class ProjectCreatedEvent {
  constructor(
    readonly projectId: number,
    readonly projectName: string,
    readonly ownerId: number | null,
  ) {}
}
