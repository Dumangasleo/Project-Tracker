import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue'; // I-move mo yung dating SideBar content dito
import Projects from '../views/Projects.vue';
import Tasks from '../views/Tasks.vue';
import Teams from '../views/Teams.vue';
import Settings from '../views/Settings.vue';

const routes = [
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

export default router;