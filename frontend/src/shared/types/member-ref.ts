export interface MemberRef {
  id: number;
  firstName: string;
  lastName: string;
}

export const fullName = (member: Pick<MemberRef, 'firstName' | 'lastName'>): string =>
  `${member.firstName} ${member.lastName}`.trim();
