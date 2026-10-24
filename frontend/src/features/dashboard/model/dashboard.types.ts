import type { Priority } from '@/shared/constants/priority';

export interface DashboardTask {
  id: number;
  name: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
}

export interface DashboardOverview {
  stats: {
    activeProjects: number;
    completedProjects: number;
    failedProjects: number;
    pendingTasks: number;
  };
  upcomingTasks: DashboardTask[];
  blockers: DashboardTask[];
}
