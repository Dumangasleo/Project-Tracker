/** Emitted when a new project is registered. */
export class ProjectCreatedEvent {
    constructor(
        public readonly projectId: number,
        public readonly projectName: string,
        public readonly ownerId: number | null,
    ) {}
}
