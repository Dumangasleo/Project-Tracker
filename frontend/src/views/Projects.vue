<script setup lang="ts">
import { onMounted, reactive, ref, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTeamStore } from '@/store/teamStore';
import { useProject } from '@/composables/useProject';
import { useInfiniteScroll } from '@/composables/InfiniteScrolling/useInfiniteScroll'; // 👈 IMPORTANTE: Gidugang nato ang atong Infinite Scroll
import { getStatusLabel, getStatusColor } from '@/utils/StatusColor.js';
import AppGrid from '@/components/Grid/AppGrid.vue';

const teamStore = useTeamStore();
const { members } = storeToRefs(teamStore);

// Gikuha nato ang fetchPaginatedProjects kay kini ang mo-return og raw data para sa Infinite Scroll
const { addProject, updateProject, deleteProject, fetchPaginatedProjects } = useProject();

interface Project {
  id: number;
  ProjectName: string;
  Description: string;
  TeamMemberId: number | null;
  Status: number;
  Priority: number;
}

const columns = [
  { key: 'ProjectName', label: 'Project Name' },
  { key: 'TeamMemberId', label: 'Team Lead' },
  { key: 'Status', label: 'Status' },
  { key: 'Priority', label: 'Priority' },
  { key: 'actions', label: 'Actions', class: 'text-center' },
];

// ─── 1. INFINITE SCROLL LOGIC (Mura nag Tasks.vue) ─────────────
const { items: lazyProjects, loading: isLoading, hasMore, loadMore, reset } = useInfiniteScroll(
    async (page: number) => {
      // Gigamit nato ang fetchPaginatedProjects with empty search string para i-load tanan
      return await fetchPaginatedProjects(page, '');
    }
);

// I-cast ang lazyProjects as Ref<Project[]> para makabasa ang TypeScript
const projects = lazyProjects as Ref<Project[]>;

// ─── Initial load ─────────────────────────────────────────────────
onMounted(async () => {
  await teamStore.fetchMembers();
  await loadMore(); // 👈 Trigger the first batch of 20 items inig abli sa page
});

// ─── Modal & form state ───────────────────────────────
const isModalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const activeMenuId = ref<number | null>(null);
const isSubmitting = ref(false);

const form = reactive({
  ProjectName: '', Description: '', TeamMemberId: null as number | null, Status: 0, Priority: 1
});

const resetForm = () => Object.assign(form, {
  ProjectName: '', Description: '', TeamMemberId: null, Status: 0, Priority: 1
});

const openModal = (project: Project | null = null) => {
  if (project) {
    isEditing.value = true;
    editingId.value = project.id;
    Object.assign(form, {
      ProjectName: project.ProjectName, Description: project.Description,
      TeamMemberId: project.TeamMemberId, Status: project.Status, Priority: project.Priority
    });
  } else {
    isEditing.value = false;
    editingId.value = null;
    resetForm();
  }
  isModalOpen.value = true;
};

const openNewProjectModal = () => {
  openModal(null);
};

const closeModal = () => { isModalOpen.value = false; resetForm(); };

// ─── 2. MUTATION HANDLERS (Add/Update) ─────────────────────────────
const handleSubmit = async () => {
  isSubmitting.value = true;
  const payload = {
    ...form,
    TeamMemberId: form.TeamMemberId ? Number(form.TeamMemberId) : null,
    Status: Number(form.Status),
    Priority: Number(form.Priority)
  };

  const result = isEditing.value
      ? await updateProject(editingId.value!, payload)
      : await addProject(payload);

  isSubmitting.value = false;

  if (result.success) {
    closeModal();
    reset();
    await loadMore();
  }
};

const removeProject = async (id: number) => {
  if (confirm('Are you sure you want to delete this project?')) {
    const result = await deleteProject(id);
    if (result.success) {
      reset();
      await loadMore();
    }
  }
};

const toggleMenu = (id: number) => activeMenuId.value = activeMenuId.value === id ? null : id;

const getPriorityLabel = (p: number) => ({ 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' }[p] || 'LOW');
const getMemberName = (memberId: number) => {
  if (!memberId) return 'No Lead Assigned';
  const m = members.value.find(m => m.id === Number(memberId));
  return m ? `${m.FirstName} ${m.LastName}` : `User ${memberId}`;
};
</script>

<template>
  <div class="p-8 w-full h-full flex flex-col">
    <header class="flex justify-between items-center mb-8 shrink-0">
      <div>
        <h1 class="text-3xl font-bold text-white">Project Management</h1>
        <p class="text-slate-400">Organize and monitor your high-level project goals.</p>
      </div>
      <button @click="openNewProjectModal"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20">
        + New Project
      </button>
    </header>

    <div class="flex-1 min-h-0 relative">
      <AppGrid
          :columns="columns"
          :data="projects"
          :loading="isLoading"
          :has-more="hasMore"
          @load-more="loadMore"
          class="absolute inset-0 h-full overflow-y-auto"
      >
        <template #cell-ProjectName="{ item } : {item:Project}">
          <p class="text-white font-medium">{{ item.ProjectName }}</p>
          <p class="text-slate-500 text-sm truncate max-w-xs">{{ item.Description }}</p>
        </template>

        <template #cell-TeamMemberId="{ item } : {item:Project}">
          <span class="text-slate-400 text-sm">{{ getMemberName(item.TeamMemberId) }}</span>
        </template>

        <template #cell-Status="{ item } : {item:Project}">
          <span :class="['px-2 py-1 rounded text-xs font-bold uppercase border', getStatusColor(item.Status)]">
            {{ getStatusLabel(item.Status) }}
          </span>
        </template>

        <template #cell-Priority="{ item } : {item:Project}">
          <span class="text-slate-400 text-xs font-medium">{{ getPriorityLabel(item.Priority) }}</span>
        </template>

        <template #cell-actions="{ item } : {item:Project}">
          <div class="text-center relative">
            <button @click.stop="toggleMenu(item.id)"
                    class="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
              <span class="text-xl">⋮</span>
            </button>
            <div v-if="activeMenuId === item.id"
                 class="absolute right-36 top-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
              <button @click="openModal(item); activeMenuId = null"
                      class="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-indigo-600 transition-colors">Edit</button>
              <button @click="removeProject(item.id); activeMenuId = null"
                      class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
            </div>
          </div>
        </template>
      </AppGrid>
    </div>

    <Teleport to="body">
      <div
          v-if="isModalOpen"
          class="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          @click.self="closeModal"
      >
        <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">

          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">
              {{ isEditing ? 'Edit Project' : 'Register New Project' }}
            </h2>
            <button @click="closeModal" class="text-slate-500 hover:text-white transition-colors text-xl">
              &times;
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Project Name</label>
              <input
                  v-model="form.ProjectName"
                  type="text"
                  placeholder="e.g. E-Commerce Platform"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Description</label>
              <textarea
                  v-model="form.Description"
                  placeholder="Describe the project goals..."
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white h-24 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Team Lead</label>
              <select
                  v-model="form.TeamMemberId"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option :value="null">-- Select a Lead --</option>
                <option v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.FirstName }} {{ member.LastName }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Status</label>
                <select v-model="form.Status" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option :value="0">Planning</option>
                  <option :value="1">Active</option>
                  <option :value="2">Completed</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Priority</label>
                <select v-model="form.Priority" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option :value="1">Low</option>
                  <option :value="2">Medium</option>
                  <option :value="3">High</option>
                </select>
              </div>
            </div>
          </div>

          <div class="mt-8 flex gap-3">
            <button
                @click="closeModal"
                class="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
                @click="handleSubmit"
                :disabled="!form.ProjectName || isSubmitting"
                class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
            >
              <span v-if="isSubmitting">Saving...</span>
              <span v-else>{{ isEditing ? 'Update' : 'Save' }} Project</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>