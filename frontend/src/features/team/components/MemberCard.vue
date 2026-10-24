<script setup lang="ts">
import { Mail, Pencil, Phone, Trash2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { fullName } from '@/shared/types/member-ref';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import DropdownMenu from '@/shared/ui/DropdownMenu.vue';
import type { MenuItem } from '@/shared/ui/types';
import type { TeamMember } from '../model/team.types';

const props = defineProps<{ member: TeamMember }>();
const emit = defineEmits<{ edit: [member: TeamMember]; remove: [member: TeamMember] }>();

const name = computed(() => fullName(props.member));
const online = computed(() => props.member.status === 'online');

const actions: MenuItem[] = [
  { label: 'Edit', icon: Pencil, onSelect: () => emit('edit', props.member) },
  { label: 'Remove', icon: Trash2, danger: true, onSelect: () => emit('remove', props.member) },
];
</script>

<template>
  <article
    class="group relative flex flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-md"
  >
    <div class="flex items-start gap-3">
      <div class="relative">
        <BaseAvatar :name="name" size="md" />
        <span
          :class="[
            'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface',
            online ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600',
          ]"
          :title="online ? 'Online' : 'Offline'"
        />
      </div>
      <div class="min-w-0 flex-1">
        <button
          type="button"
          class="block max-w-full truncate text-left text-sm font-semibold text-fg after:absolute after:inset-0 hover:text-accent-fg focus-visible:outline-none"
          @click="emit('edit', member)"
        >
          {{ name }}
        </button>
        <p class="truncate text-sm text-fg-muted">{{ member.position?.title ?? 'No position' }}</p>
      </div>
      <div class="relative z-10">
        <DropdownMenu :items="actions" :label="`Actions for ${name}`" />
      </div>
    </div>

    <dl class="mt-4 space-y-2 border-t border-line pt-4 text-sm">
      <div class="flex items-center gap-2 text-fg-muted">
        <Mail class="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        <dt class="sr-only">Email</dt>
        <dd class="truncate">{{ member.email }}</dd>
      </div>
      <div class="flex items-center gap-2 text-fg-muted">
        <Phone class="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        <dt class="sr-only">Contact number</dt>
        <dd class="truncate">{{ member.contactNumber || '—' }}</dd>
      </div>
    </dl>
  </article>
</template>
