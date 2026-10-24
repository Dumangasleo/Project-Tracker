import { Priority } from '@/shared/constants/priority';
import type { MemberRef } from '@/shared/types/member-ref';
import type { ToneOption } from '@/shared/types/tone';

export const ProjectStatus = {
  Planning: 0,
  Active: 1,
  Completed: 2,
  OnHold: 3,
  Failed: 4,
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const PROJECT_STATUS_OPTIONS: readonly ToneOption<ProjectStatus>[] = [
  { value: ProjectStatus.Planning, label: 'Planning', tone: 'neutral' },
  { value: ProjectStatus.Active, label: 'Active', tone: 'info' },
  { value: ProjectStatus.Completed, label: 'Completed', tone: 'success' },
  { value: ProjectStatus.OnHold, label: 'On hold', tone: 'warning' },
  { value: ProjectStatus.Failed, label: 'Failed', tone: 'danger' },
];

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  leadId: number | null;
  lead: MemberRef | null;
  repository: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  leadId: number | null;
}

export interface ProjectForm {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  leadId: number | null;
}

export const emptyProjectForm = (): ProjectForm => ({
  name: '',
  description: '',
  status: ProjectStatus.Planning,
  priority: Priority.Low,
  leadId: null,
});

export const projectToForm = (project: Project): ProjectForm => ({
  name: project.name,
  description: project.description ?? '',
  status: project.status,
  priority: project.priority,
  leadId: project.leadId,
});

export const formToProjectInput = (form: ProjectForm): ProjectInput => ({
  name: form.name.trim(),
  description: form.description.trim(),
  status: form.status,
  priority: form.priority,
  leadId: form.leadId,
});
