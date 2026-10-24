<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { errorMessage } from '@/core/http/api-error';
import { useAuthStore } from '@/features/auth';
import { GitAccountCard } from '@/features/git';
import { useTheme, type ThemePreference } from '@/shared/composables/useTheme';
import { useToast } from '@/shared/composables/useToast';
import type { Option } from '@/shared/types/tone';
import { formatDate } from '@/shared/utils/date';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';
import PageHeader from '@/shared/ui/PageHeader.vue';
import SegmentedControl from '@/shared/ui/SegmentedControl.vue';
import { settingsApi, type AboutInfo, type Profile } from '../api/settings.api';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const { preference } = useTheme();

const profile = ref<Profile | null>(null);
const about = ref<AboutInfo | null>(null);
const signingOut = ref(false);

const themeOptions: Option<ThemePreference>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const name = computed(() => (profile.value ? `${profile.value.firstName} ${profile.value.lastName}` : ''));

onMounted(async () => {
  try {
    [profile.value, about.value] = await Promise.all([settingsApi.profile(), settingsApi.about()]);
  } catch (failure) {
    toast.error('Could not load settings', errorMessage(failure));
  }
});

async function signOut(): Promise<void> {
  signingOut.value = true;
  try {
    await auth.logout();
  } finally {
    signingOut.value = false;
    await router.replace({ name: 'login' });
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <PageHeader title="Settings" description="Manage your profile and preferences." />

    <BaseCard title="Profile" description="Your account details in this workspace.">
      <div v-if="!profile" class="flex items-center gap-4">
        <BaseSkeleton class="size-14 rounded-full" />
        <div class="flex-1 space-y-2">
          <BaseSkeleton class="h-4 w-1/3" />
          <BaseSkeleton class="h-3 w-1/2" />
        </div>
      </div>
      <div v-else class="flex flex-col gap-5 sm:flex-row sm:items-center">
        <BaseAvatar :name="name" size="lg" />
        <dl class="grid flex-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-fg-muted">Name</dt>
            <dd class="mt-0.5 font-medium text-fg">{{ name }}</dd>
          </div>
          <div>
            <dt class="text-fg-muted">Email</dt>
            <dd class="mt-0.5 truncate font-medium text-fg">{{ profile.email }}</dd>
          </div>
          <div>
            <dt class="text-fg-muted">Position</dt>
            <dd class="mt-0.5 font-medium text-fg">{{ profile.position?.title ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-fg-muted">Member since</dt>
            <dd class="mt-0.5 font-medium text-fg">{{ formatDate(profile.createdAt) }}</dd>
          </div>
        </dl>
      </div>
    </BaseCard>

    <GitAccountCard />

    <BaseCard title="Appearance" description="Choose how Vortex Sync looks on this device.">
      <SegmentedControl v-model="preference" :options="themeOptions" label="Theme" />
    </BaseCard>

    <BaseCard title="About">
      <div v-if="about" class="space-y-1 text-sm">
        <p class="text-fg">{{ about.description }}</p>
        <p class="text-fg-muted">{{ about.name }} · Version {{ about.version }}</p>
      </div>
      <BaseSkeleton v-else class="h-4 w-2/3" />
    </BaseCard>

    <BaseCard title="Session" description="Sign out of Vortex Sync on this device.">
      <BaseButton variant="secondary" :loading="signingOut" @click="signOut">
        <LogOut class="size-4" aria-hidden="true" />
        Sign out
      </BaseButton>
    </BaseCard>
  </div>
</template>
