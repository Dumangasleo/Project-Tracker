import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/features/auth';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    title?: string;
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/app/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/features/dashboard/views/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/features/projects/views/ProjectsView.vue'),
          meta: { title: 'Projects' },
        },
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('@/features/tasks/views/TasksView.vue'),
          meta: { title: 'Tasks' },
        },
        {
          path: 'reviews',
          name: 'reviews',
          component: () => import('@/features/reviews/views/ReviewsView.vue'),
          meta: { title: 'Code reviews' },
        },
        {
          path: 'reviews/:id(\\d+)',
          name: 'review-detail',
          component: () => import('@/features/reviews/views/ReviewDetailView.vue'),
          meta: { title: 'Code review' },
        },
        {
          path: 'team',
          name: 'team',
          component: () => import('@/features/team/views/TeamView.vue'),
          meta: { title: 'Team' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/features/settings/views/SettingsView.vue'),
          meta: { title: 'Settings' },
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/app/layouts/AuthLayout.vue'),
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/features/auth/views/LoginView.vue'),
          meta: { guestOnly: true, title: 'Sign in' },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/features/auth/views/RegisterView.vue'),
          meta: { guestOnly: true, title: 'Create account' },
        },
        {
          path: 'auth/callback',
          name: 'sso-callback',
          component: () => import('@/features/auth/views/SsoCallbackView.vue'),
          meta: { title: 'Signing in' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.restoreSession();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Vortex Sync` : 'Vortex Sync';
});
