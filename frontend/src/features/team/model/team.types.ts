export interface Position {
  id: number;
  title: string;
  department: string;
  accessLevel: number;
}

export type MemberStatus = 'online' | 'offline';

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  address: string | null;
  contactNumber: string | null;
  isVerified: boolean;
  positionId: number;
  position: Position | null;
  avatar: string | null;
  status: MemberStatus | string;
  createdAt: string;
}

export interface MemberInput {
  firstName: string;
  lastName: string;
  email: string;
  positionId: number;
  contactNumber?: string;
  address?: string;
}

export interface MemberForm {
  firstName: string;
  lastName: string;
  email: string;
  positionId: number | null;
  contactNumber: string;
  address: string;
}

export const emptyMemberForm = (): MemberForm => ({
  firstName: '',
  lastName: '',
  email: '',
  positionId: null,
  contactNumber: '',
  address: '',
});

export const memberToForm = (member: TeamMember): MemberForm => ({
  firstName: member.firstName,
  lastName: member.lastName,
  email: member.email,
  positionId: member.positionId,
  contactNumber: member.contactNumber ?? '',
  address: member.address ?? '',
});

export function formToMemberInput(form: MemberForm): MemberInput {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    positionId: form.positionId!,
    contactNumber: form.contactNumber.trim(),
    address: form.address.trim(),
  };
}
