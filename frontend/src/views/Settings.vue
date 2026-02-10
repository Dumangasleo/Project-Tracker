<script setup>
import {onMounted, ref} from 'vue';
import api from "@/plugins/axios.js";

// Temporary state para sa toggle
const isDarkMode = ref(true);
const profile = ref({});
const about = ref({});
const isLoading = ref(true);

const handleLogout = () => {
  console.log("Logging out...");

  alert("Logging out of Vortex Sync...");
};

const fetchSettings = async () => {
  try {
    const [profileRes, aboutRes] = await Promise.all([
      api.get('/settings/profile'),
      api.get('/settings/about')
    ]);
    profile.value = profileRes.data;
    about.value = aboutRes.data;
  } catch (err) {
    console.error("Error loading settings:", err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchSettings);
</script>

<template>
  <div class="p-8 text-white max-w-4xl">
    <header class="mb-10">
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="text-slate-400">Manage your account settings and preferences.</p>
    </header>

    <div class="space-y-8">
      <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          👤 Profile Information
        </h2>
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl border border-slate-700">
            👤
          </div>
          <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-slate-500 uppercase font-bold mb-1">Username</label>
              <input type="text" :value="profile.username" disabled class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 outline-none" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 uppercase font-bold mb-1">Email</label>
              <input type="email" :value="profile.email" disabled class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 outline-none" />
            </div>
          </div>
        </div>
      </section>

      <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          ⚙️ Preferences
        </h2>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="font-medium">Interface Theme</p>
            <p class="text-sm text-slate-500">Switch between dark and light mode.</p>
          </div>
          <button
              @click="isDarkMode = !isDarkMode"
              :class="isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'"
              class="w-14 h-7 rounded-full relative transition-colors duration-300 shadow-inner"
          >
            <div
                :class="isDarkMode ? 'translate-x-8' : 'translate-x-1'"
                class="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 flex items-center justify-center text-[10px]"
            >
              {{ isDarkMode ? '🌙' : '☀️' }}
            </div>
          </button>
        </div>
      </section>

      <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
        <h2 class="text-xl font-semibold mb-4 text-white">📖 About Vortex Sync</h2>
        <p class="text-sm leading-relaxed">
          {{about.version}}
        </p>

        <p class="text-xs text-slate-500 mt-4">
          Version {{ about.version }} • Made with Vue 3 & NestJS by {{ about.author }}
        </p>
      </section>

      <div class="pt-4">
        <button
            @click="handleLogout"
            class="w-full md:w-auto bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-8 py-3 rounded-xl font-bold transition-all"
        >
          🚪 Log Out Account
        </button>
      </div>
    </div>
  </div>
</template>