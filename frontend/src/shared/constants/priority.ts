import type { ToneOption } from '@/shared/types/tone';

export const Priority = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const PRIORITY_OPTIONS: readonly ToneOption<Priority>[] = [
  { value: Priority.Low, label: 'Low', tone: 'success' },
  { value: Priority.Medium, label: 'Medium', tone: 'warning' },
  { value: Priority.High, label: 'High', tone: 'danger' },
];
