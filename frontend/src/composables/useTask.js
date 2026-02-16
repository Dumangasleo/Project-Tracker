import { ref } from 'vue';
import { useTaskStore } from '@/store/taskStore';
import { mapToAssignTaskDTO } from '@/api/task.dto';

export function useTask() {
    const taskStore = useTaskStore();
    const isSubmitting = ref(false);
    const errorMessage = ref(null);

    // 1. Assign Task (Existing)
    const assignTask = async (formData) => {
        isSubmitting.value = true;
        errorMessage.value = null;
        try {
            const payload = mapToAssignTaskDTO(formData);
            await taskStore.assignTaskAction(payload);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || "Task Assignment Failed.";
            return { success: false, error: errorMessage.value };
        } finally {
            isSubmitting.value = false;
        }
    };

    // 2. Update Task (Bago)
    const updateTask = async (id, formData) => {
        isSubmitting.value = true;
        errorMessage.value = null;
        try {
            // I-transform ang data gamit ang DTO bago i-update
            const payload = mapToAssignTaskDTO(formData);
            await taskStore.updateTaskAction(id, payload);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || "Update Failed.";
            return { success: false, error: errorMessage.value };
        } finally {
            isSubmitting.value = false;
        }
    };

    // 3. Delete Task (Bago)
    const deleteTask = async (id) => {
        // Pwedeng gumamit ng ibang loading state kung ayaw mong ma-disable ang buong page
        isSubmitting.value = true;
        errorMessage.value = null;
        try {
            await taskStore.deleteTaskAction(id);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || "Delete Failed.";
            return { success: false, error: errorMessage.value };
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        assignTask,
        updateTask,
        deleteTask,
        isSubmitting,
        errorMessage,
        loading: taskStore.loading
    };
}