<script setup lang="ts">
import {
  Bell,
  BellOff,
  CircleCheck,
  Clock,
  FolderKanban,
  GitPullRequest,
  MessageSquare,
  UserCheck,
  UserPlus,
} from 'lucide-vue-next';
import { onBeforeUnmount, onMounted, ref, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useClickOutside } from '@/shared/composables/useClickOutside';
import { relativeTime } from '@/shared/utils/date';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import {
  REVIEW_NOTIFICATION_TYPES,
  type AppNotification,
  type NotificationType,
} from '../model/notification.types';
import { useNotificationsStore } from '../store/notifications.store';

const store = useNotificationsStore();
const router = useRouter();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const icons: Record<NotificationType, Component> = {
  TASK_ASSIGNED: CircleCheck,
  PROJECT_CREATED: FolderKanban,
  MEMBER_REGISTERED: UserPlus,
  REMINDER: Clock,
  REVIEW_REQUESTED: GitPullRequest,
  REVIEW_COMMENT: MessageSquare,
  REVIEW_DECISION: UserCheck,
};

onMounted(store.startPolling);
onBeforeUnmount(store.stopPolling);
useClickOutside([root], () => (open.value = false));

function onSelect(notification: AppNotification): void {
  void store.markAsRead(notification.id);
  if (REVIEW_NOTIFICATION_TYPES.includes(notification.type) && notification.referenceId !== null) {
    open.value = false;
    void router.push({ name: 'review-detail', params: { id: notification.referenceId } });
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false;
}
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <button
      type="button"
      class="relative inline-flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
      :aria-label="store.unreadCount ? `Notifications, ${store.unreadCount} unread` : 'Notifications'"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <Bell class="size-[18px]" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-surface"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        role="dialog"
        aria-label="Notifications"
        class="absolute right-0 z-40 mt-2 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-elevated shadow-xl"
      >
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 class="text-sm font-semibold text-fg">Notifications</h2>
          <button
            v-if="store.unreadCount > 0"
            type="button"
            class="text-xs font-medium text-accent-fg hover:underline"
            @click="store.markAllRead"
          >
            Mark all as read
          </button>
        </div>

        <div class="overflow-y-auto">
          <BaseEmptyState
            v-if="store.items.length === 0"
            :icon="BellOff"
            title="You're all caught up"
            description="New assignments and reminders will show up here."
          />
          <ul v-else class="divide-y divide-line">
            <li v-for="notification in store.items" :key="notification.id">
              <button
                type="button"
                :class="[
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted',
                  !notification.isRead && 'bg-accent-soft/40',
                ]"
                @click="onSelect(notification)"
              >
                <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
                  <component :is="icons[notification.type] ?? Bell" class="size-4" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-medium text-fg">{{ notification.title }}</span>
                  <span class="block text-sm text-fg-muted">{{ notification.message }}</span>
                  <span class="mt-1 block text-xs text-fg-subtle">{{ relativeTime(notification.createdAt) }}</span>
                </span>
                <span v-if="!notification.isRead" class="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>
