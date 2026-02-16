<script setup>
import { onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTaskStore } from '@/store/taskStore';
import { useTeamStore } from '@/store/teamStore';
import { useTask } from '@/composables/useTask';

// 1. Initialize Stores and Composables
const taskStore = useTaskStore();
const teamStore = useTeamStore();
const { tasks, loading } = storeToRefs(taskStore);
const { members } = storeToRefs(teamStore);
const { assignTask, updateTask, deleteTask, isSubmitting, errorMessage } = useTask();

// 2. Local UI State
const activeMenuId = ref(null);
const editingTaskId = ref(null);
const isModalOpen = ref(false);

const form = reactive({
  TaskName: '',
  Description: '',
  TeamMemberId: null,
  ProjectId: 1,
  Priority: 1,
  Status: 0,
  DueDate: ''
});

// 3. Custom Directive para sa Kebab Menu (Click Outside)
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};

// 4. Methods
const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingTaskId.value = null; // Reset edit mode
  form.TaskName = '';
  form.Description = '';
  form.TeamMemberId = null;
  form.Priority = 1;
  form.Status = 0;
  form.DueDate = '';
};

const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};

const closeMenu = () => {
  activeMenuId.value = null;
};

const openEditModal = (task) => {
  editingTaskId.value = task.id;
  // I-fill ang form gamit ang data ng task na i-e-edit
  form.TaskName = task.TaskName;
  form.Description = task.Description;
  form.TeamMemberId = task.TeamMemberId;
  form.Priority = task.Priority;
  form.Status = task.Status;
  form.DueDate = task.DueDate ? task.DueDate.split('T')[0] : '';

  isModalOpen.value = true;
  closeMenu();
};


const handleSubmit = async () => {
  let result;

  if (editingTaskId.value) {
    // UPDATE: Ngayon ay dadaan na sa composable
    result = await updateTask(editingTaskId.value, form);
  } else {
    // CREATE: Dadaan din sa composable
    result = await assignTask(form);
    // Kung success ang create, i-refresh ang listahan
    if (result.success) await taskStore.fetchTasks();
  }

  // Isasara lang ang modal kung walang error
  if (result && result.success) {
    closeModal();
  }
};

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this task?')) {
    const result = await deleteTask(id);
    if (result.success) { closeMenu(); }
  }
};

onMounted(() => {
  taskStore.fetchTasks();
  teamStore.fetchMembers();
});

// 5. Helpers
const getPriorityLabel = (priority) => {
  const map = { 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' };
  return map[priority] || 'LOW';
};

const getPriorityColor = (priority) => {
  if (priority === 3) return 'text-red-400 bg-red-400/10';
  if (priority === 2) return 'text-amber-400 bg-amber-400/10';
  return 'text-emerald-400 bg-emerald-400/10';
};

const getStatusLabel = (status) => {
  const map = { 0: 'Todo', 1: 'In Progress', 2: 'Done' };
  return map[status] || 'Todo';
};

const formatDate = (dateString) => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleDateString();
};

const getMemberName = (memberId) => {
  if (!memberId) return 'Unassigned';
  const searchId = Number(memberId);
  const member = members.value.find(m => m.id === searchId);
  return member ? `${member.FirstName} ${member.LastName}` : `Loading... (${memberId})`;
};

const getProjectName = (projectId) => {
  if (!projectId) return 'Unassigned';
  const searchId = Number(projectId);
  const member = members.value.find(m => m.id === searchId);
  return member ? `${member.FirstName} ${member.LastName}` : `Loading... (${projectId})`;
};
</script>

<template>
  <div class="p-8">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white">Tasks Management</h1>
        <p class="text-slate-400">Keep track of your team's daily objectives.</p>
      </div>
      <button
          @click="openModal"
          class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        + New Task
      </button>
    </header>

    <div class="bg-slate-900 border border-slate-800 rounded-xl">
      <table class="w-full text-left">
        <thead class="bg-slate-800/50 text-slate-400 text-sm uppercase">
        <tr>
          <th class="px-6 py-4 font-medium">Date Assigned</th>
          <th class="px-6 py-4 font-medium">Project</th>
          <th class="px-6 py-4 font-medium">Task Name</th>
          <th class="px-6 py-4 font-medium">Member</th>
          <th class="px-6 py-4 font-medium">Status</th>
          <th class="px-6 py-4 font-medium">Priority</th>
          <th class="px-6 py-4 font-medium">Due Date</th>
          <th class="px-6 py-4 font-medium text-center">Actions</th>
        </tr>
        </thead>

        <tbody class="divide-y divide-slate-800">
        <tr v-if="loading">
          <td colspan="6" class="px-6 py-12 text-center text-slate-500">
            <div class="flex flex-col items-center gap-2">
              <span class="animate-spin text-2xl">⏳</span>
              <p class="animate-pulse"> Fetching tasks from server...</p>
            </div>
          </td>
        </tr>

        <tr v-else-if="tasks.length === 0">
          <td colspan="6" class="px-6 py-12 text-center text-slate-500">
            <div class="flex flex-col items-center gap-1">
              <span class="text-3xl">📋</span>
              <p>No tasks found. Click "+ New Task" to start.</p>
            </div>
          </td>
        </tr>

        <tr v-else v-for="task in tasks" :key="task.id" class="hover:bg-slate-800/30 transition-colors">
          <td class="px-6 py-4 text-slate-400 text-sm">{{ formatDate(task.DateCreated) }}</td>
          <td class="px-6 py-4 text-slate-400 text-sm">{{ formatDate(task.ProjectId) }}</td>
          <td class="px-6 py-4">
            <p class="text-white font-medium">{{ task.TaskName }}</p>
            <p class="text-slate-500 text-sm">{{ task.Description }}</p>
          </td>
          <td class="px-6 py-4 text-slate-400 text-sm">{{ getMemberName(task.TeamMemberId) }}</td>
          <td class="px-6 py-4">
              <span class="px-2 py-1 rounded text-xs font-bold uppercase bg-slate-800 text-slate-300">
                {{ getStatusLabel(task.Status) }}
              </span>
          </td>
          <td class="px-6 py-4">
              <span :class="['px-2 py-1 rounded text-xs font-bold uppercase', getPriorityColor(task.Priority)]">
                {{ getPriorityLabel(task.Priority) }}
              </span>
          </td>
          <td class="px-6 py-4 text-slate-400 text-sm">{{ formatDate(task.DueDate) }}</td>

          <td class="px-6 py-4 text-center relative">
            <button
                @click.stop="toggleMenu(task.id)"
                class="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
              <span class="text-xl">⋮</span>
            </button>

            <div
                v-if="activeMenuId === task.id"
                v-click-outside="closeMenu"
                class="absolute right-12 top-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden"
            >
              <button
                  @click="openEditModal(task)"
                  class="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-indigo-600 transition-colors"
              >
                Edit
              </button>
              <button
                  @click="handleDelete(task.id)"
                  class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-bold text-white mb-6">Assign New Task</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
            <input v-model="form.TaskName" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea v-model="form.Description" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1">Assign Member</label>
              <select v-model="form.TeamMemberId" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option :value="null">Select Member</option>
                <option v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.FirstName }} {{ member.LastName }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1">Priority</label>
              <select v-model="form.Priority" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option :value="1">Low</option>
                <option :value="2">Medium</option>
                <option :value="3">High</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
            <input v-model="form.DueDate" type="date" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div class="mt-8 flex gap-3">
          <button @click="closeModal" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors">Cancel</button>
          <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {{ isSubmitting ? 'Saving...' : 'Save Task' }}
          </button>
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm mt-4 text-center">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>