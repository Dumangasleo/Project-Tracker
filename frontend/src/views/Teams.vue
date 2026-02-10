<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/plugins/axios';
import { useTeam } from '@/composables/useTeam';
import {useTeamStore} from "@/store/teamStore.js";
import {storeToRefs} from "pinia";

// Para sa combo box
const showModal = ref(false); // Control para sa modal

const isEditing = ref(false);
const currentMemberId = ref(null);

// Form State
const form = ref({
  FirstName: '',
  LastName: '',
  MiddleName: '',
  Email: '',
  Address: '',
  ContactNumber: '',
  PositionID: '',
  Avatar: '👤',
  Status: 'offline'
});

const modalTitle = computed(() => isEditing.value ? 'Edit Team Member' : 'New Team Member');
const teamStore = useTeamStore();
const { members, positions, loading } = storeToRefs(teamStore);
const {
  saveMember: apiSaveMember,
  deleteMember: apiDeleteMember,
  isSubmitting
} = useTeam();


// Function para buksan ang modal para sa Edit
const editMember = (member) => {
  isEditing.value = true;
  currentMemberId.value = member.id;

  // I-fill ang form gamit ang data ng member
  form.value = {
    ...member,
    PositionID: member.position?.id || member.PositionID // Siguraduhing tugma sa select field
  };
  showModal.value = true;
};

// Function para sa Clean Reset
const resetForm = () => {
  showModal.value = false;
  isEditing.value = false;
  currentMemberId.value = null;
  form.value = { FirstName: '', LastName: '', Email: '', PositionID: '', Avatar: '👤', Status: 'offline' };
};

const saveMember = async () => {
    const result = await apiSaveMember(form.value, isEditing.value, currentMemberId.value);

    if (result.success) {
      resetForm();
    } else {
      alert(result.error);
    }
};

const confirmDelete = async (member = null) => {
  const idToDelete = member.id || currentMemberId.value;
  const nameToDisplay = member?  `${member.FirstName} ${member.LastName}` : "this member is deleted";

  if (!idToDelete) return;

  if (confirm(`Are you sure you want to remove ${nameToDisplay}?`)) {
    const result = await apiDeleteMember(idToDelete);

    if (result.success) {
      if(showModal.value) resetForm();
    } else {
      alert(result.error);
    }
  }
};

onMounted(() => {
  teamStore.fetchMembers();
  teamStore.fetchPositions();
});
</script>


<template>
  <div class="p-8 text-white relative">
    <header class="mb-10 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold">Team Members</h1>
        <p class="text-slate-400">The brilliant minds behind Vortex Sync.</p>
      </div>
      <button
          @click="resetForm(); showModal = true"
          class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
      >
        + Add New Member
      </button>
    </header>

    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div class="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>

          <h2 class="text-2xl font-bold mb-2">{{modalTitle}}</h2>
          <p class="text-slate-400 text-sm mb-6">Enter details to register a new collaborator.</p>

          <form @submit.prevent="saveMember" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">First Name</label>
                <input v-model="form.FirstName" type="text" required class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Last Name</label>
                <input v-model="form.LastName" type="text" required class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
              <input v-model="form.Email" type="email" required class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Position / Role</label>
                <select v-model="form.PositionID" required class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 transition-colors appearance-none">
                  <option disabled value="">Select Position</option>
                  <option v-for="pos in positions" :key="pos.id" :value="pos.id">
                    {{ pos.Title }}
                  </option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Contact Number</label>
                <input v-model="form.ContactNumber" type="text" class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase ml-1">Address</label>
              <textarea v-model="form.Address" class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 transition-colors h-20 resize-none"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" @click="showModal = false" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
              <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all">
                {{ isEditing ? 'Save Changes' : 'Register Member' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="member in members" :key="member.id"
           @click="editMember(member)"
           class="cursor-pointer bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500 hover:bg-slate-800/50 transition-all group relative overflow-hidden"
      >

        <div class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-[10px] bg-indigo-500 px-2 py-0.5 rounded text-white uppercase font-bold">Edit</span>
        </div>

        <div class="absolute top-4 right-4 flex items-center gap-1.5">
      <span :class="member.Status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'"
            class="w-2 h-2 rounded-full animate-pulse"></span>
          <span class="text-[10px] uppercase font-bold text-slate-500">{{ member.Status }}</span>
        </div>

        <button
            @click.stop="confirmDelete(member)"
            class="absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"
            title="Delete Member"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-2xl border border-slate-700">
            {{ member.Avatar }}
          </div>
          <div>
            <h3 class="font-bold text-lg group-hover:text-indigo-400">{{ member.FirstName }} {{ member.LastName }}</h3>
            <p class="text-indigo-500 text-sm font-medium">{{ member.position?.Title || 'No Role' }}</p>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-slate-800">
          <p class="text-xs text-slate-500 mb-1">Email Address</p>
          <p class="text-sm text-slate-300 font-mono">{{ member.Email }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>