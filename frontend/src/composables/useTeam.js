import { ref } from 'vue';
import {useTeamStore} from "@/store/teamStore.js";// I-assume natin na may Pinia store ka
import { mapToUpdateTeamDTO } from '@/api/team.dto';

export function useTeam() {
    const teamStore = useTeamStore();
    const isSubmitting = ref(false);
    const errorMessage = ref(null);

    const saveMember = async (formData, isEditing, id) => {
        isSubmitting.value = true;
        errorMessage.value = null;

        try {
            // 1. Transform/Clean the data using DTO
            const payload = mapToUpdateTeamDTO(formData);

            // 2. Tawagin ang action sa Store
            // Ang encryption ay mangyayari sa loob ng Axios Interceptor na ginagamit ng Store
            if (isEditing) {
                await teamStore.updateMemberAction(id, payload);
            } else {
                await teamStore.addMemberAction(payload);
            }

            return { success: true };
        } catch (error) {
            // Dito mo mahuhuli kung ang error ay "Handshake Refused" (400)
            errorMessage.value = error.response?.data?.message || "Security Handshake Failed.";
            console.error("Save Member Error:", error);
            return { success: false, error: errorMessage.value };
        } finally {
            isSubmitting.value = false;
        }
    };

    const deleteMember = async (id) => {
        if (!id) return { success: false, error: "Missing ID" };

        isSubmitting.value = true;
        errorMessage.value = null;

        try {
            // Tawagin ang action sa Store na gumagawa ng actual API delete
            await teamStore.deleteMemberAction(id);
            return { success: true };
        } catch (error) {
            errorMessage.value = error.response?.data?.message || "Delete Handshake Failed.";
            return { success: false, error: errorMessage.value };
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        saveMember,
        deleteMember,
        isSubmitting,
        errorMessage
    };
}