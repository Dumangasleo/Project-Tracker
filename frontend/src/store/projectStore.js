import { defineStore } from 'pinia';
import api from '../plugins/axios';
import { ref } from 'vue';

export const useProjectStore = defineStore('project', () => {
    const projects = ref([]);
    const loading = ref(false);

    // ✅ Now accepts { skip, take, append }
    async function fetchProjects({ skip = 0, take = 20, append = false } = {}) {
        loading.value = true;
        try {
            const response = await api.get('/projects', {
                params: { skip, take }
            });


            const incoming = response.data.items || [];

            if (append) {
                projects.value = [...projects.value, ...incoming];
            } else {
                projects.value = incoming;
            }

            return incoming;
        } finally {
            loading.value = false;
        }
    }

    // createProject, updateProject, deleteProject unchanged
    async function createProject(payload) {
        const response = await api.post('/projects/assign-projects', payload);
        if (response.data) {
            projects.value = [response.data, ...projects.value];
        }
        return response.data;
    }

    async function updateProject(id, payload) {
        try {
            const response = await api.put(`/projects/update-projects/${id}`, payload);
            const index = projects.value.findIndex((p) => p.id === id);
            if (index !== -1) projects.value[index] = response.data;
            return response.data;
        } catch (error) {
            console.error('Update error', error);
            throw error;
        }
    }

    async function deleteProject(id) {
        try {
            await api.delete(`/projects/delete-projects/${id}`);
            projects.value = projects.value.filter((p) => p.id !== id);
        } catch (error) {
            console.error('Delete error', error);
            throw error;
        }
    }

    async function fetchPaginatedProjects(page, search = '') {
        try {
            const limit = 20;
            const skip = (page - 1) * limit;

            const response = await api.get('/projects', {
                params: { skip, take: limit, search }
            });


            return response.data.items || [];
        } catch (error) {
            console.error("Fetch Paginated Projects Error:", error);
            return [];
        }
    }

    return { projects, loading, fetchProjects, createProject, updateProject, deleteProject, fetchPaginatedProjects };
});