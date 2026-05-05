import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProjectStore } from '@/store/projectStore.js';
import { mapToProjectDTO } from '@/api/project.dto';

export function useProject() {
    const store = useProjectStore();
    const { projects } = storeToRefs(store);

    const isLoading = ref(false);
    const errorMessage = ref(null);

    // ✅ Now accepts page/limit/append — returns { count } so the view knows when to stop
    const getProjects = async ({ page = 1, limit = 20, append = false } = {}) => {
        isLoading.value = true;
        errorMessage.value = null;
        try {
            const skip = (page - 1) * limit;

            // 1. Ang 'response' diri kay { items: [...], count: 123 } na
            const response = await store.fetchProjects({ skip, take: limit, append });

            // 2. I-extract ang items para sa count checking
            const items = response?.items || [];

            // I-return ang count base sa items array length
            return { count: items.length };
        } catch (error) {
            errorMessage.value = 'Hindi makuha ang listahan ng projects.';
            return { count: 0 };
        } finally {
            isLoading.value = false;
        }
    };

    const addProject = async (formData) => {
        isLoading.value = true;
        errorMessage.value = null;
        try {
            const payload = mapToProjectDTO(formData);
            await store.createProject(payload);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Nagka-error sa pag-add ng project.';
            return { success: false };
        } finally {
            isLoading.value = false;
        }
    };

    const updateProject = async (id, formData) => {
        isLoading.value = true;
        errorMessage.value = null;
        try {
            const payload = mapToProjectDTO(formData);
            await store.updateProject(id, payload);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Failed to update project.';
            return { success: false };
        } finally {
            isLoading.value = false;
        }
    };

    const deleteProject = async (id) => {
        isLoading.value = true;
        errorMessage.value = null;
        try {
            await store.deleteProject(id);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Failed to delete project.';
            return { success: false };
        } finally {
            isLoading.value = false;
        }
    };


    const fetchPaginatedProjects = async (page, search = '') => {
        try {
            const response = await store.fetchPaginatedProjects(page, search);

            return response || [];
        } catch (error) {
            console.error('Error fetching paginated projects:', error);
            return [];
        }
    };

    return { projects, isLoading, errorMessage, getProjects, addProject, updateProject, deleteProject, fetchPaginatedProjects };
}