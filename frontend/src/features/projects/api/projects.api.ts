import { http } from '@/core/http/http-client';
import type { Paginated } from '@/shared/types/pagination';
import type { Project, ProjectInput } from '../model/project.types';

export interface ProjectQuery {
  page: number;
  limit?: number;
  search?: string;
}

export const projectsApi = {
  async list(query: ProjectQuery): Promise<Paginated<Project>> {
    const { data } = await http.get<Paginated<Project>>('/projects', {
      params: { page: query.page, limit: query.limit ?? 20, search: query.search || undefined },
    });
    return data;
  },

  async create(input: ProjectInput): Promise<Project> {
    const { data } = await http.post<Project>('/projects', input);
    return data;
  },

  async update(id: number, input: Partial<ProjectInput>): Promise<Project> {
    const { data } = await http.patch<Project>(`/projects/${id}`, input);
    return data;
  },

  async remove(id: number): Promise<void> {
    await http.delete(`/projects/${id}`);
  },
};
