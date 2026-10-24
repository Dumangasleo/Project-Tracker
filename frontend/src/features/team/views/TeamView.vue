<script setup lang="ts">
import { Search, UserPlus, Users } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import { fullName } from '@/shared/types/member-ref';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';
import PageHeader from '@/shared/ui/PageHeader.vue';
import MemberCard from '../components/MemberCard.vue';
import MemberFormModal from '../components/MemberFormModal.vue';
import type { TeamMember } from '../model/team.types';
import { useTeamStore } from '../store/team.store';

const team = useTeamStore();
const toast = useToast();
const { confirm } = useConfirm();

const search = ref('');
const modalOpen = ref(false);
const editing = ref<TeamMember | null>(null);

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return team.members;
  return team.members.filter((member) =>
    [fullName(member), member.email, member.position?.title ?? '']
      .some((value) => value.toLowerCase().includes(query)),
  );
});

onMounted(() => {
  team.fetchMembers(true).catch((failure) => toast.error('Could not load team', errorMessage(failure)));
});

function openCreate(): void {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(member: TeamMember): void {
  editing.value = member;
  modalOpen.value = true;
}

async function remove(member: TeamMember): Promise<void> {
  const confirmed = await confirm({
    title: 'Remove team member?',
    message: `${fullName(member)} will lose access to the workspace. This cannot be undone.`,
    confirmLabel: 'Remove',
    danger: true,
  });
  if (!confirmed) return;

  try {
    await team.removeMember(member.id);
    toast.success('Member removed', fullName(member));
  } catch (failure) {
    toast.error('Could not remove member', errorMessage(failure));
  }
}
</script>

<template>
  <div>
    <PageHeader title="Team" description="The people collaborating in this workspace.">
      <template #actions>
        <BaseButton @click="openCreate">
          <UserPlus class="size-4" aria-hidden="true" />
          Add member
        </BaseButton>
      </template>
    </PageHeader>

    <div class="mb-5 max-w-sm">
      <BaseInput v-model="search" type="search" placeholder="Search by name, email or role" aria-label="Search members">
        <template #leading><Search class="size-4" /></template>
      </BaseInput>
    </div>

    <div v-if="team.loading && !team.loaded" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="n in 6" :key="n" class="rounded-xl border border-line bg-surface p-5">
        <div class="flex items-center gap-3">
          <BaseSkeleton class="size-10 rounded-full" />
          <div class="flex-1 space-y-2">
            <BaseSkeleton class="h-4 w-2/3" />
            <BaseSkeleton class="h-3 w-1/3" />
          </div>
        </div>
        <BaseSkeleton class="mt-5 h-3 w-3/4" />
      </div>
    </div>

    <div v-else-if="filtered.length > 0" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MemberCard
        v-for="member in filtered"
        :key="member.id"
        :member="member"
        @edit="openEdit"
        @remove="remove"
      />
    </div>

    <div v-else class="rounded-xl border border-dashed border-line-strong bg-surface">
      <BaseEmptyState
        :icon="Users"
        :title="search ? 'No matching members' : 'No team members yet'"
        :description="search ? 'Try a different name, email or role.' : 'Add your first collaborator to get started.'"
      >
        <BaseButton v-if="!search" @click="openCreate">
          <UserPlus class="size-4" aria-hidden="true" />
          Add member
        </BaseButton>
      </BaseEmptyState>
    </div>

    <MemberFormModal v-model:open="modalOpen" :member="editing" />
  </div>
</template>
