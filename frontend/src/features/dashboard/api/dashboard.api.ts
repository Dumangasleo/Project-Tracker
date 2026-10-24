import { http } from '@/core/http/http-client';
import type { DashboardOverview } from '../model/dashboard.types';

export const dashboardApi = {
  async overview(): Promise<DashboardOverview> {
    const { data } = await http.get<DashboardOverview>('/dashboard/overview');
    return data;
  },
};
