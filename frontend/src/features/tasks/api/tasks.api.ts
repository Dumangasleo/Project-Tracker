import { http } from '@/core/http/http-client';
import type { Paginated } from '@/shared/types/pagination';
import type { Task, TaskInput, TaskType } from '../model/task.types';

export interface TaskQuery {
  page: number;
  limit?: number;
  type?: TaskType | null;
}

export const tasksApi = {
  async list(query: TaskQuery): Promise<Paginated<Task>> {
    const { data } = await http.get<Paginated<Task>>('/tasks', {
      params: { page: query.page, limit: query.limit ?? 20, type: query.type ?? undefined },
    });
    return data;
  },

  async create(input: TaskInput): Promise<Task> {
    const { data } = await http.post<Task>('/tasks', input);
    return data;
  },

  async update(id: number, input: Partial<TaskInput>): Promise<Task> {
    const { data } = await http.patch<Task>(`/tasks/${id}`, input);
    return data;
  },

  async claim(id: number): Promise<Task> {
    const { data } = await http.post<Task>(`/tasks/${id}/claim`);
    return data;
  },

  async remove(id: number): Promise<void> {
    await http.delete(`/tasks/${id}`);
  },
};
