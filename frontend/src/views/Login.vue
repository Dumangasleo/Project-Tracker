<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

const router = useRouter();
const auth = useAuthStore();

const mode = ref('login'); // 'login' | 'register'
const loading = ref(false);
const error = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
});

const toggleMode = () => {
  error.value = '';
  mode.value = mode.value === 'login' ? 'register' : 'login';
};

const submit = async () => {
  loading.value = true;
  error.value = '';
  try {
    if (mode.value === 'login') {
      await auth.login(form.email, form.password);
    } else {
      await auth.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
    }
    router.push('/');
  } catch (e) {
    const message = e.response?.data?.message;
    error.value = Array.isArray(message)
      ? message.join(', ')
      : message || (mode.value === 'login' ? 'Login failed.' : 'Registration failed.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 p-4">
    <div class="w-full max-w-sm">
      <div class="flex items-center gap-3 justify-center mb-8">
        <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          V
        </div>
        <span class="text-2xl font-bold text-white tracking-tight">Vortex Sync</span>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h1 class="text-lg font-bold text-white mb-1">
          {{ mode === 'login' ? 'Welcome back' : 'Create your account' }}
        </h1>
        <p class="text-xs text-slate-500 mb-6">
          {{ mode === 'login' ? 'Log in to your dev workspace.' : 'Register to join the dev team.' }}
        </p>

        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="mode === 'register'" class="grid grid-cols-2 gap-3">
            <input
              v-model="form.firstName"
              placeholder="First name"
              required
              class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              v-model="form.lastName"
              placeholder="Last name"
              required
              class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <input
            v-model="form.email"
            type="email"
            placeholder="Email"
            required
            class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          />

          <input
            v-model="form.password"
            type="password"
            placeholder="Password"
            required
            class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          />

          <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {{ loading ? 'Please wait…' : (mode === 'login' ? 'Log in' : 'Register') }}
          </button>
        </form>

        <div class="mt-5 text-center">
          <button @click="toggleMode" class="text-xs text-slate-400 hover:text-indigo-400">
            {{ mode === 'login' ? "No account? Register" : 'Have an account? Log in' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
