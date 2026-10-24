import { http } from '@/core/http/http-client';
import type { GitAccount, GitServerStatus, ProjectRepository, RepositoryMode } from '../model/git.types';

export const gitApi = {
  async status(): Promise<GitServerStatus> {
    const { data } = await http.get<GitServerStatus>('/git/status');
    return data;
  },

  async getAccount(): Promise<GitAccount | null> {
    const { data } = await http.get<GitAccount | null>('/git/account');
    return data || null;
  },

  async saveAccount(input: { username?: string; password: string }): Promise<GitAccount> {
    const { data } = await http.put<GitAccount>('/git/account', input);
    return data;
  },

  async getRepository(projectId: number): Promise<ProjectRepository | null> {
    const { data } = await http.get<ProjectRepository | null>(`/projects/${projectId}/repository`);
    return data || null;
  },

  async attachRepository(
    projectId: number,
    input: { mode: RepositoryMode; name?: string; fullName?: string },
  ): Promise<ProjectRepository> {
    const { data } = await http.post<ProjectRepository>(`/projects/${projectId}/repository`, input);
    return data;
  },

  async detachRepository(projectId: number): Promise<void> {
    await http.delete(`/projects/${projectId}/repository`);
  },
};
