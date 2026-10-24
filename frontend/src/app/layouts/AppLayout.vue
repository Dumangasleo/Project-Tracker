<script setup lang="ts">
import { Menu, Moon, Sun, X } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth';
import { NotificationBell } from '@/features/notifications';
import { useTheme } from '@/shared/composables/useTheme';
import BaseIconButton from '@/shared/ui/BaseIconButton.vue';
import AppSidebar from '../components/AppSidebar.vue';
import BrandMark from '../components/BrandMark.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { resolved: theme, toggle: toggleTheme } = useTheme();

const mobileNavOpen = ref(false);

watch(() => route.fullPath, () => (mobileNavOpen.value = false));

// Signed out here, in another tab, or the session expired: leave the protected area.
watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) void router.replace({ name: 'login', query: { redirect: route.fullPath } });
  },
);
</script>

<template>
  <div class="min-h-screen">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <AppSidebar />
    </aside>

    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div v-if="mobileNavOpen" class="fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" @click="mobileNavOpen = false" />
        <aside class="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
          <AppSidebar @navigate="mobileNavOpen = false" />
          <button
            type="button"
            class="absolute top-4 -right-12 rounded-lg bg-surface p-2 text-fg shadow"
            aria-label="Close navigation"
            @click="mobileNavOpen = false"
          >
            <X class="size-5" />
          </button>
        </aside>
      </div>
    </Transition>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur sm:px-6 lg:px-8"
      >
        <BaseIconButton class="lg:hidden" label="Open navigation" @click="mobileNavOpen = true">
          <Menu class="size-5" />
        </BaseIconButton>
        <div class="lg:hidden"><BrandMark /></div>

        <div class="ml-auto flex items-center gap-1">
          <BaseIconButton
            :label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'dark'" class="size-[18px]" />
            <Moon v-else class="size-[18px]" />
          </BaseIconButton>
          <NotificationBell />
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
