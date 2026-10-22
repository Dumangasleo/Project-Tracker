import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Projects from '../views/Projects.vue';
import Tasks from '../views/Tasks.vue';
import Teams from '../views/Teams.vue';
import Settings from '../views/Settings.vue';
import Login from '../views/Login.vue';
import { useAuthStore } from '@/store/authStore';

const routes = [
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/', component: Dashboard },
    { path: '/projects', component: Projects },
    { path: '/tasks', component: Tasks },
    { path: '/team', component: Teams },
    { path: '/settings', component: Settings },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Global auth guard: protected pages need a token; the login page is public.
router.beforeEach((to) => {
    const auth = useAuthStore();

    if (to.meta.public) {
        // Already logged in? Skip the login page.
        if (auth.isAuthenticated && to.path === '/login') return '/';
        return true;
    }

    if (!auth.isAuthenticated) return '/login';
    return true;
});

export default router;
