<script setup>
import { ref } from 'vue';
import { useNotification } from '@/composables/useNotification';
import { notificationIcon, relativeTime } from '@/api/notification.dto';

const { items, loading, unreadCount, markAsRead, markAllRead } = useNotification();

const open = ref(false);
const toggle = () => (open.value = !open.value);
const close = () => (open.value = false);

const onItemClick = (n) => {
  if (!n.IsRead) markAsRead(n.id);
};
</script>

<template>
  <div class="relative">
    <!-- Bell button -->
    <button
      @click="toggle"
      :title="`${unreadCount} unread`"
      class="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
    >
      <span class="text-lg">🔔</span>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Click-away backdrop -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close"></div>

    <!-- Dropdown panel -->
    <div
      v-if="open"
      class="absolute left-0 top-12 z-50 w-80 max-h-[70vh] flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 class="text-sm font-bold text-white">Notifications</h3>
        <button
          v-if="unreadCount > 0"
          @click="markAllRead"
          class="text-xs font-medium text-indigo-400 hover:text-indigo-300"
        >
          Mark all read
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Loading (first load only) -->
        <p
          v-if="loading && items.length === 0"
          class="px-4 py-6 text-center text-xs text-slate-500"
        >
          Loading…
        </p>

        <!-- Empty state -->
        <div v-else-if="items.length === 0" class="px-4 py-10 text-center">
          <div class="text-3xl mb-2">📭</div>
          <p class="text-xs text-slate-500">You're all caught up.</p>
        </div>

        <!-- List -->
        <button
          v-for="n in items"
          :key="n.id"
          @click="onItemClick(n)"
          class="w-full flex gap-3 px-4 py-3 text-left border-b border-slate-800/60 hover:bg-slate-800/50 transition-colors"
          :class="{ 'bg-slate-800/30': !n.IsRead }"
        >
          <span class="text-lg leading-none mt-0.5">{{ notificationIcon(n.Type) }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-100 truncate">{{ n.Title }}</p>
            <p class="text-xs text-slate-400">{{ n.Message }}</p>
            <p class="text-[10px] text-slate-600 mt-1">{{ relativeTime(n.CreatedAt) }}</p>
          </div>
          <span
            v-if="!n.IsRead"
            class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>
