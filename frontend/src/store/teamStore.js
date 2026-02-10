import { defineStore } from 'pinia';
import api from '@/plugins/axios';

export const useTeamStore = defineStore('team', {
    state: () => ({
        members: [],
        positions: [],
        loading: false
    }),
    actions: {
        async fetchMembers() {
            this.loading = true;
            try {
                // Ang response dito ay automatic nang de-decrypted ng Axios interceptor
                const response = await api.get('/team');
                this.members = response.data;
            } finally {
                this.loading = false;
            }
        },

        async fetchPositions() {
            // Check if we already have positions to avoid redundant calls
            if (this.positions.length > 0) return;

            try {
                const res = await api.get('/team/positions');
                this.positions = res.data;
            } catch (err) {
                console.error("Error loading positions:", err);
            }
        },


        async addMemberAction(payload) {
            const response = await api.post('/team', payload);
            // I-push ang bagong member sa local state para mag-update ang UI agad
            this.members.push(response.data);
        },
        async updateMemberAction(id, payload) {
            const response = await api.put(`/team/${id}`, payload);
            const index = this.members.findIndex(m => m.id === id);
            if (index !== -1) this.members.splice(index, 1, response.data);
        },

        async deleteMemberAction(id) {
            this.loading = true;
            try {
                // 1. Tawagin ang API para sa deletion
                await api.delete(`/team/${id}`);

                // 2. Optimistic UI Update: Alisin ang member sa local state
                // para hindi na kailangang mag-refresh ng page ang user.
                const index = this.members.findIndex(m => m.id === id);
                if (index !== -1) {
                    this.members.splice(index, 1);
                }

                return { success: true };
            } catch (err) {
                console.error("Error deleting member:", err);
                throw err; // Ipasa ang error sa UI para ma-handle ng catch block doon
            } finally {
                this.loading = false;
            }
        }
    }
});