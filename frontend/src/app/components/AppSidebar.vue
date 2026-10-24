<script setup lang="ts">
import { FolderKanban, GitPullRequest, LayoutDashboard, ListChecks, LogOut, Settings, Users } from 'lucide-vue-next';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BrandMark from './BrandMark.vue';

const emit = defineEmits<{ navigate: [] }>();

const auth = useAuthStore();
const router = useRouter();

const navigation = [
  { label: 'Dashboard', to: { name: 'dashboard' }, icon: LayoutDashboard },
  { label: 'Projects', to: { name: 'projects' }, icon: FolderKanban },
  { label: 'Tasks', to: { name: 'tasks' }, icon: ListChecks },
  { label: 'Code reviews', to: { name: 'reviews' }, icon: GitPullRequest },
  { label: 'Team', to: { name: 'team' }, icon: Users },
  { label: 'Settings', to: { name: 'settings' }, icon: Settings },
];

async function signOut(): Promise<void> {
  await auth.logout();
  await router.replace({ name: 'login' });
}
</script>

<template>
  <div class="flex h-full flex-col border-r border-line bg-surface">
    <div class="flex h-16 shrink-0 items-center px-5">
      <BrandMark />
    </div>

    <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main">
      <RouterLink
        v-for="item in navigation"
        :key="item.label"
        v-slot="{ href, navigate, isExactActive, isActive }"
        :to="item.to"
        custom
      >
        <a
          :href="href"
          :aria-current="(item.to.name === 'dashboard' ? isExactActive : isActive) ? 'page' : undefined"
          :class="[
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            (item.to.name === 'dashboard' ? isExactActive : isActive)
              ? 'bg-accent-soft text-accent-fg'
              : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
          ]"
          @click="(event) => { navigate(event); emit('navigate'); }"
        >
          <component :is="item.icon" class="size-[18px] shrink-0" aria-hidden="true" />
          {{ item.label }}
        </a>
      </RouterLink>
    </nav>

    <div class="border-t border-line p-3">
      <div class="flex items-center gap-3 rounded-lg px-2 py-2">
        <BaseAvatar :name="auth.displayName || auth.user?.email || '?'" size="sm" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-fg">{{ auth.displayName }}</p>
          <p class="truncate text-xs text-fg-muted">{{ auth.user?.email }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg p-2 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
          aria-label="Sign out"
          title="Sign out"
          @click="signOut"
        >
          <LogOut class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
