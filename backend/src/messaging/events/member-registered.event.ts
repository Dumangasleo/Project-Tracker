export class MemberRegisteredEvent {
  constructor(
    readonly memberId: number,
    readonly fullName: string,
  ) {}
}
