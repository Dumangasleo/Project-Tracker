// src/store/taskStore.js
import {defineStore} from 'pinia';
import {ref} from 'vue';
import api from '@/plugins/axios';

export const useTaskStore = defineStore('task', () => {
    const tasks = ref([]);
    const loading = ref(false);

    // Existing function (gets everything)
    async function fetchTasks() {
        loading.value = true;
        try {
            const response = await api.get('/tasks');
            tasks.value = response.data;
        } finally {
            loading.value = false;
        }
    }


    async function fetchPaginatedTasks(page, taskType = 'ALL') {
        try {
            const response = await api.get('/tasks', {
                params: {
                    page: page,
                    limit: 10,
                    taskType: taskType
                }
            });


            return response.data;
        } catch (error) {
            console.error("Fetch Paginated Error:", error);
            throw error;
        }
    }

    async function assignTaskAction(payload) {
        const response = await api.post('/tasks/assign', payload);
        tasks.value.unshift(response.data);
        return response.data;
    }

    async function updateTaskAction(id, payload) {
        try {
            const response = await api.put(`/tasks/${id}`, payload);
            const index = tasks.value.findIndex(t => t.id === id);
            if (index !== -1) {
                tasks.value[index] = response.data;
            }
            return response.data;
        } catch (error) {
            console.error("Update Error:", error);
            throw error;
        }
    }

    async function deleteTaskAction(id) {
        try {
            await api.delete(`/tasks/${id}`);
            tasks.value = tasks.value.filter(t => t.id !== id);
        } catch (error) {
            console.error("Delete Error:", error);
            throw error;
        }
    }

    // HIGHLIGHT: Make sure i-add ang fetchPaginatedTasks diri sa return!
    return {
        tasks,
        loading,
        fetchTasks,
        fetchPaginatedTasks,
        assignTaskAction,
        updateTaskAction,
        deleteTaskAction
    };
});