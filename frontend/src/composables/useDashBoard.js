import { ref } from 'vue';
import api from '@/plugins/axios';

export function useDashboard() {
    const activeProjectsCount = ref(0);
    const successfulProjectsCount = ref(0);
    const failedProjectsCount = ref(0);
    const pendingTasksCount = ref(0);
    const urgentTasks = ref([]);
    const highPriorityBlockers = ref([]);

    const fetchDashboardData = async () => {
        console.log("1. Gitawag ang fetchDashboardData function!"); // 👈 DEBUG 1

        try {
            console.log("2. Mo-try na og request sa backend..."); // 👈 DEBUG 2

            const response = await api.get('/dashboard/overview');

            console.log("3. Naka-uli ang data gikan sa backend!", response.data); // 👈 DEBUG 3
            const data = response.data;

            activeProjectsCount.value = data.activeProjectsCount || 0;
            successfulProjectsCount.value = data.successfulProjectsCount || 0;
            failedProjectsCount.value = data.failedProjectsCount || 0;
            pendingTasksCount.value = data.pendingTasksCount || 0;
            urgentTasks.value = data.urgentTasks || [];
            highPriorityBlockers.value = data.highPriorityBlockers || [];

        } catch (error) {
            console.error('4. Naay error pag-fetch sa dashboard:', error); // 👈 DEBUG 4
        }
    };

    return {
        fetchDashboardData,
        activeProjectsCount,
        successfulProjectsCount,
        failedProjectsCount,
        pendingTasksCount,
        urgentTasks,
        highPriorityBlockers,
    };
}