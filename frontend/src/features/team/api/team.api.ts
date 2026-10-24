import { http } from '@/core/http/http-client';
import type { MemberInput, Position, TeamMember } from '../model/team.types';

export const teamApi = {
  async listMembers(): Promise<TeamMember[]> {
    const { data } = await http.get<TeamMember[]>('/team/members');
    return data;
  },

  async listPositions(): Promise<Position[]> {
    const { data } = await http.get<Position[]>('/team/positions');
    return data;
  },

  async createMember(input: MemberInput): Promise<TeamMember> {
    const { data } = await http.post<TeamMember>('/team/members', input);
    return data;
  },

  async updateMember(id: number, input: Partial<MemberInput>): Promise<TeamMember> {
    const { data } = await http.patch<TeamMember>(`/team/members/${id}`, input);
    return data;
  },

  async removeMember(id: number): Promise<void> {
    await http.delete(`/team/members/${id}`);
  },
};
