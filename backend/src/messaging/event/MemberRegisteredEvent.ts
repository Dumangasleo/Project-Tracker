/** Emitted when a new member joins the dev team. */
export class MemberRegisteredEvent {
    constructor(
        public readonly memberId: number,
        public readonly fullName: string,
        public readonly email: string,
    ) {}
}
