<script setup lang="ts">
import { onMounted, reactive, ref, watch, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore } from '@/store/taskStore';
import { useTeamStore } from '@/store/teamStore';
import { useTask } from '@/composables/useTask';
import { useProject } from '@/composables/useProject'; //
import { useInfiniteScroll } from '@/composables/InfiniteScrolling/useInfiniteScroll';

import AppGrid from '@/components/Grid/AppGrid.vue';
import AppButton from "@/components/Buttons/AppButton.vue";
import AppComboBox from "@/components/ComboBox/AppComboBox.vue";

// 1. Initialize Stores and Composables
const taskStore = useTaskStore();
const teamStore = useTeamStore();
const { members } = storeToRefs(teamStore);
const { assignTask, updateTask, deleteTask, isSubmitting, errorMessage } = useTask();
const { projects, getProjects, fetchPaginatedProjects } = useProject();

// 2. UI State & Form
const form = reactive({
  TaskName: '',
  Description: '',
  TeamMemberId: null as number | null,
  ProjectId: null as number | null,
  Priority: 1,
  Status: 0,
  TaskType: 0,
  DueDate: ''
});

type Task = typeof form & { id: number; DateCreated: string; CreatedBy: number };

const activeMenuId = ref<number | null>(null);
const editingTaskId = ref<number | null>(null);
const isModalOpen = ref(false);

const tabs = [
  { id: 'ALL', label: 'All Tickets' },
  { id: 0, label: 'General' },
  { id: 1, label: 'Features' },
  { id: 2, label: 'Bug Fixes' },
  { id: 3, label: 'Hot Fixes' },
  { id: 4, label: 'Releases' }
];
const activeTab = ref<number | string>('ALL');

const columns = [
  { key: 'DateCreated',  label: 'Assigned', width: '100px' },
  { key: 'ProjectId',    label: 'Project',  width: '120px' },
  { key: 'TaskName',     label: 'Objective', width: '320px' }, // Mas dako ni kay naa diri ang description
  { key: 'CreatedBy',    label: 'Creator',     width: '140px' },
  { key: 'TeamMemberId', label: 'Assignee',  width: '140px' },
  { key: 'Status',       label: 'Status',    width: '100px' },
  { key: 'Priority',     label: 'Priority',  width: '100px' },
  { key: 'actions',      label: 'Actions',   align: 'center', width: '120px' },
];

// 4. Infinite Scroll
const { items, loading, hasMore, loadMore, reset } = useInfiniteScroll(
    async (page: number) => await taskStore.fetchPaginatedTasks(page, String(activeTab.value))
);

const tasks = items as Ref<Task[]>;
const currentUserId = ref(1);
const projectSearch = ref('');
let searchTimer: any;

const {
  items: lazyProjects,
  loading: isProjectLoading,
  hasMore: hasMoreProjects,
  loadMore: loadMoreProjects,
  reset: resetProjects
} = useInfiniteScroll(
    async (page: number) => {

      return await fetchPaginatedProjects(page, projectSearch.value);
    }
);

watch(activeTab, async () => {
  reset();
  await loadMore();
});

// 5. Methods
const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingTaskId.value = null;
  Object.assign(form, {
    TaskName: '',
    Description: '',
    TeamMemberId: null,
    ProjectId: null,
    Priority: 1,
    Status: 0,
    TaskType: 0,
    DueDate: ''
  });
};

const toggleMenu = (id: number) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};

const closeMenu = () => {
  activeMenuId.value = null;
};

const openEditModal = (task: Task) => {
  editingTaskId.value = task.id;
  Object.assign(form, {
    ...task,
    ProjectId: task.ProjectId ? Number(task.ProjectId) : null,
    TeamMemberId: task.TeamMemberId ? Number(task.TeamMemberId) : null,

    DueDate: task.DueDate ? task.DueDate.split('T')[0] : ''
  });
  isModalOpen.value = true;
  closeMenu();
};

const handleSubmit = async () => {
  const payload = {
    ...form,
    CreatedBy: currentUserId.value
  };

  const result = editingTaskId.value
      ? await updateTask(editingTaskId.value, payload)
      : await assignTask(payload);

  if (result?.success) {
    closeModal();
    reset();
    await loadMore();
  }
};

const handleDelete = async (id: number) => {
  if (!confirm('Are you sure?')) return;

  const result = await deleteTask(id);
  if (result?.success) {
    closeMenu();
    reset();
    await loadMore();
  }
};

const handleProjectSearch = (query: string) => {

  clearTimeout(searchTimer);

  searchTimer = setTimeout(async () => {
    projectSearch.value = query;
    resetProjects();
    await loadMoreProjects();
  }, 300);
};

const claimTask = async (task: Task) => {
  if (!confirm('Are you sure you want to claim this ticket?')) return;

  const currentUserId = 1;
  const payload = { ...task, TeamMemberId: currentUserId };
  const result = await updateTask(task.id, payload);

  if (result?.success) {
    closeMenu();
    reset();
    await loadMore();
  }
};

onMounted(() => {
  teamStore.fetchMembers();
  getProjects({ page: 1, limit: 100 });

  console.log("Loaded Projects:", projects.value);
});

// 6. Helpers
const getPriorityLabel = (p: number) =>
    ({ 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' }[p] ?? 'LOW');

const getPriorityColor = (p: number) => {
  if (p === 3) return 'text-red-400 bg-red-400/10';
  if (p === 2) return 'text-amber-400 bg-amber-400/10';
  return 'text-emerald-400 bg-emerald-400/10';
};

const getStatusLabel = (s: number) =>
    ({ 0: 'Todo', 1: 'In Progress', 2: 'Done' }[s] ?? 'Todo');

const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : '---';

const getMemberName = (id: number | null) => {
  if (!id) return 'Unassigned';
  const member = members.value.find((m) => m.id === Number(id));
  return member ? `${member.FirstName} ${member.LastName}` : 'Unassigned';
};


const getCreatorName = (id: number | null) => {
  if (!id) return 'System';
  const member = members.value.find((m) => m.id === Number(id));
  return member ? `${member.FirstName} ${member.LastName}` : 'Unknown';
};

const getTaskTypeLabel = (type: number) => {
  const found = tabs.find(t => t.id === type);
  return found ? found.label : 'General';
};

watch(isModalOpen, (isOpen) => {
  if (isOpen && lazyProjects.value.length === 0) {
    loadMoreProjects();
  }
});
</script>

<template>
  <div class="p-8 w-full">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-white">Tasks Management</h1>
        <p class="text-slate-400">Keep track of your team's daily objectives.</p>
      </div>
      <AppButton variant="primary" @click="openModal">
        + New Task
      </AppButton>
    </header>

    <div class="flex gap-2 mb-6 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
      <AppButton
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :variant="activeTab === tab.id ? 'primary' : 'tertiary'"
          class="whitespace-nowrap"
      >
        {{ tab.label }}
      </AppButton>
    </div>

    <AppGrid
        :columns="columns"
        :data="tasks"
        :loading="loading"
        :hasMore="hasMore"
        @load-more="loadMore"
    >
      <template #cell-DateCreated="{ item }: {item: any}">
        <span class="text-slate-400 text-sm">{{ formatDate(item.DateCreated) }}</span>
      </template>

      <template #cell-ProjectId="{ item }: {item: any}">
        <span class="text-slate-400 text-sm">Project #{{ item.ProjectId }}</span>
      </template>

      <template #cell-TaskName="{ item }: {item: any}">
        <div class="max-w-xs">
          <div class="flex items-center gap-2 mb-1">
        <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-700 text-slate-300">
          {{ getTaskTypeLabel(item.TaskType) }}
        </span>
            <p class="text-white font-medium truncate">{{ item.TaskName }}</p>
          </div>
          <p class="text-slate-500 text-xs truncate">{{ item.Description }}</p>
        </div>
      </template>

      <template #cell-CreatedBy="{ item }: {item: any}">
        <div class="flex flex-col">
          <span class="text-indigo-400 text-xs font-bold uppercase"> </span>
          <span class="text-slate-300 text-sm">{{ getCreatorName(item.CreatedBy) }}</span>
        </div>
      </template>

      <template #cell-TeamMemberId="{ item }: {item: any}">
    <span :class="['text-sm', item.TeamMemberId ? 'text-slate-300' : 'text-amber-400/80 italic']">
      {{ getMemberName(item.TeamMemberId) }}
    </span>
      </template>

      <template #cell-Status="{ item }: {item: any}">
    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
      {{ getStatusLabel(item.Status) }}
    </span>
      </template>

      <template #cell-Priority="{ item }: {item: any}">
    <span :class="['px-2 py-1 rounded text-[10px] font-bold uppercase', getPriorityColor(item.Priority)]">
      {{ getPriorityLabel(item.Priority) }}
    </span>
      </template>

      <template #cell-DueDate="{ item }: {item: any}">
        <span class="text-slate-400 text-sm">{{ formatDate(item.DueDate) }}</span>
      </template>

      <template #cell-actions="{ item }: {item: any}">
        <div class="relative flex justify-center items-center gap-2 w-full">

          <AppButton
              v-if="!item.TeamMemberId && Number(item.CreatedBy) !== currentUserId"
              variant="secondary"
              text-color="#34d399"
              class="text-[10px]! py-1! px-3! uppercase tracking-widest font-bold"
              @click.stop="claimTask(item)"
          >
            Take Task
          </AppButton>

          <span
              v-else-if="!item.TeamMemberId"
              class="text-slate-500 text-[10px] uppercase font-bold italic tracking-tight"
          >
        Waiting for Assignee
      </span>

          <AppButton
              variant="tertiary"
              class="p-2! rounded-full!"
              @click.stop="toggleMenu(item.id)"
          >
            <span class="text-xl">⋮</span>
          </AppButton>

          <div
              v-if="activeMenuId === item.id"
              class="absolute right-10 top-0 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col p-1 gap-1"
          >
            <AppButton variant="tertiary" class="w-full justify-start!" @click="openEditModal(item)">
              Edit
            </AppButton>
            <AppButton variant="danger" class="w-full justify-start!" @click="handleDelete(item.id)">
              Delete
            </AppButton>
          </div>
        </div>
      </template>
    </AppGrid>

    <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
        @click.self="closeModal"
    >
      <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-bold text-white mb-6">
          {{ editingTaskId ? 'Edit Task' : 'Assign New Task' }}
        </h2>

        <div class="space-y-4">
          <div>
            <AppComboBox
                v-model="form.ProjectId"
                :items="lazyProjects"
                label-key="ProjectName"
                value-key="id"
                placeholder="Search for a project..."
                :loading="isProjectLoading"
                :has-more="hasMoreProjects"
                @load-more="loadMoreProjects"
                @search="handleProjectSearch"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Task Name
            </label>
            <input
                v-model="form.TaskName"
                type="text"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Description
            </label>
            <textarea
                v-model="form.Description"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white h-20 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Type
              </label>
              <select
                  v-model="form.TaskType"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option :value="0">General</option>
                <option :value="1">Feature</option>
                <option :value="2">Bug Fix</option>
                <option :value="3">Hot Fix</option>
                <option :value="4">Release</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Priority
              </label>
              <select
                  v-model="form.Priority"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option :value="1">Low</option>
                <option :value="2">Medium</option>
                <option :value="3">High</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Assign Member
              </label>
              <select
                  v-model="form.TeamMemberId"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option :value="null">Unassigned</option>
                <option
                    v-for="member in members"
                    :key="member.id"
                    :value="member.id"
                >
                  {{ member.FirstName }} {{ member.LastName }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Due Date
              </label>
              <input
                  v-model="form.DueDate"
                  type="date"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div class="mt-8 flex gap-3">
          <AppButton variant="secondary" class="flex-1" @click="closeModal">
            Cancel
          </AppButton>
          <AppButton variant="primary" class="flex-1" :loading="isSubmitting" @click="handleSubmit">
            Save Task
          </AppButton>
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm mt-4 text-center">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>