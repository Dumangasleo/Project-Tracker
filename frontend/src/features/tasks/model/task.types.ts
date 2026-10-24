import { Priority } from '@/shared/constants/priority';
import type { MemberRef } from '@/shared/types/member-ref';
import type { Option, ToneOption } from '@/shared/types/tone';
import { toDateInputValue } from '@/shared/utils/date';

export const TaskStatus = {
  Todo: 0,
  InProgress: 1,
  Done: 2,
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskType = {
  General: 0,
  Feature: 1,
  BugFix: 2,
  HotFix: 3,
  Release: 4,
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TASK_STATUS_OPTIONS: readonly ToneOption<TaskStatus>[] = [
  { value: TaskStatus.Todo, label: 'To do', tone: 'neutral' },
  { value: TaskStatus.InProgress, label: 'In progress', tone: 'info' },
  { value: TaskStatus.Done, label: 'Done', tone: 'success' },
];

export const TASK_TYPE_OPTIONS: readonly ToneOption<TaskType>[] = [
  { value: TaskType.General, label: 'General', tone: 'neutral' },
  { value: TaskType.Feature, label: 'Feature', tone: 'accent' },
  { value: TaskType.BugFix, label: 'Bug fix', tone: 'warning' },
  { value: TaskType.HotFix, label: 'Hot fix', tone: 'danger' },
  { value: TaskType.Release, label: 'Release', tone: 'success' },
];

export const TASK_FILTER_OPTIONS: readonly Option<TaskType | null>[] = [
  { value: null, label: 'All tasks' },
  ...TASK_TYPE_OPTIONS.map(({ value, label }) => ({ value, label })),
];

export interface Task {
  id: number;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  projectId: number | null;
  project: { id: number; name: string } | null;
  assigneeId: number | null;
  assignee: MemberRef | null;
  createdById: number;
  creator: MemberRef | null;
  estimatedHours: number | string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  name: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  projectId: number;
  assigneeId: number | null;
  estimatedHours: number | null;
  dueDate: string | null;
}

export interface TaskForm {
  name: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  projectId: number | null;
  assigneeId: number | null;
  estimatedHours: string;
  dueDate: string;
}

export const emptyTaskForm = (): TaskForm => ({
  name: '',
  description: '',
  status: TaskStatus.Todo,
  priority: Priority.Low,
  type: TaskType.General,
  projectId: null,
  assigneeId: null,
  estimatedHours: '',
  dueDate: '',
});

export const taskToForm = (task: Task): TaskForm => ({
  name: task.name,
  description: task.description ?? '',
  status: task.status,
  priority: task.priority,
  type: task.type,
  projectId: task.projectId,
  assigneeId: task.assigneeId,
  estimatedHours: task.estimatedHours != null ? String(Number(task.estimatedHours)) : '',
  dueDate: toDateInputValue(task.dueDate),
});

export function formToTaskInput(form: TaskForm): TaskInput {
  const hours = Number(form.estimatedHours);
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    type: form.type,
    projectId: form.projectId!,
    assigneeId: form.assigneeId,
    estimatedHours: String(form.estimatedHours) !== '' && Number.isFinite(hours) ? hours : null,
    dueDate: form.dueDate || null,
  };
}
