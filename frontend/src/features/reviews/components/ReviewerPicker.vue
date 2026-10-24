<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTeamStore } from '@/features/team';
import { fullName } from '@/shared/types/member-ref';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';

const selected = defineModel<number[]>({ required: true });
const props = defineProps<{ excludeId?: number | null }>();

const team = useTeamStore();
const search = ref('');

const candidates = computed(() => {
  const term = search.value.trim().toLowerCase();
  return team.members
    .filter((member) => member.id !== props.excludeId)
    .filter((member) => !term || fullName(member).toLowerCase().includes(term))
    .sort(
      (a, b) =>
        (b.position?.accessLevel ?? 0) - (a.position?.accessLevel ?? 0) ||
        fullName(a).localeCompare(fullName(b)),
    );
});

function toggle(id: number): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((existing) => existing !== id)
    : [...selected.value, id];
}
</script>

<template>
  <div class="space-y-2">
    <BaseInput v-model="search" type="search" placeholder="Search teammates" aria-label="Search reviewers" />
    <ul class="max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line" role="group">
      <li v-for="member in candidates" :key="member.id">
        <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-muted">
          <input
            type="checkbox"
            class="size-4 rounded border-line text-accent focus:ring-accent/30"
            :checked="selected.includes(member.id)"
            @change="toggle(member.id)"
          />
          <BaseAvatar :name="fullName(member)" size="xs" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-fg">{{ fullName(member) }}</span>
            <span class="block truncate text-xs text-fg-muted">{{ member.position?.title ?? 'Member' }}</span>
          </span>
        </label>
      </li>
      <li v-if="candidates.length === 0" class="px-3 py-4 text-center text-sm text-fg-muted">
        No teammates found.
      </li>
    </ul>
  </div>
</template>
