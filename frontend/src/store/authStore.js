import { defineStore } from 'pinia';
import api from '@/plugins/axios';

const TOKEN_KEY = 'vortex_token';
const USER_KEY = 'vortex_user';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem(TOKEN_KEY) || null,
        user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        displayName: (state) =>
            state.user ? `${state.user.FirstName} ${state.user.LastName}` : 'Guest',
    },

    actions: {
        async login(email, password) {
            const res = await api.post('/auth/login', { email, password });
            this.setSession(res.data);
        },

        async register(payload) {
            const res = await api.post('/auth/register', payload);
            this.setSession(res.data);
        },

        setSession({ accessToken, user }) {
            this.token = accessToken;
            this.user = user;
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        },

        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        },
    },
});
