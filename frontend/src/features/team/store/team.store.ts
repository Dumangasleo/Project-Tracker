import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { fullName } from '@/shared/types/member-ref';
import type { Option } from '@/shared/types/tone';
import { teamApi } from '../api/team.api';
import type { MemberInput, Position, TeamMember } from '../model/team.types';

/** Shared member/position lookup, also used by projects and tasks for their pickers. */
export const useTeamStore = defineStore('team', () => {
  const members = ref<TeamMember[]>([]);
  const positions = ref<Position[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  let membersRequest: Promise<void> | null = null;

  const memberOptions = computed<Option<number>[]>(() =>
    members.value.map((member) => ({ value: member.id, label: fullName(member) })),
  );
  const positionOptions = computed<Option<number>[]>(() =>
    positions.value.map((position) => ({ value: position.id, label: position.title })),
  );

  function fetchMembers(force = false): Promise<void> {
    if (loaded.value && !force) return Promise.resolve();
    membersRequest ??= (async () => {
      loading.value = true;
      try {
        members.value = await teamApi.listMembers();
        loaded.value = true;
      } finally {
        loading.value = false;
        membersRequest = null;
      }
    })();
    return membersRequest;
  }

  async function fetchPositions(): Promise<void> {
    if (positions.value.length === 0) positions.value = await teamApi.listPositions();
  }

  async function createMember(input: MemberInput): Promise<TeamMember> {
    const member = await teamApi.createMember(input);
    members.value = [...members.value, member].sort(byName);
    return member;
  }

  async function updateMember(id: number, input: Partial<MemberInput>): Promise<TeamMember> {
    const member = await teamApi.updateMember(id, input);
    members.value = members.value.map((existing) => (existing.id === id ? member : existing)).sort(byName);
    return member;
  }

  async function removeMember(id: number): Promise<void> {
    await teamApi.removeMember(id);
    members.value = members.value.filter((member) => member.id !== id);
  }

  return {
    members,
    positions,
    loading,
    loaded,
    memberOptions,
    positionOptions,
    fetchMembers,
    fetchPositions,
    createMember,
    updateMember,
    removeMember,
  };
});

function byName(a: TeamMember, b: TeamMember): number {
  return fullName(a).localeCompare(fullName(b));
}
