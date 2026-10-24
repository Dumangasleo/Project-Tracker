import type { Tone } from '@/shared/types/tone';

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormat.format(new Date(value)) : '—';
}

export function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function relativeTime(value: string): string {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function dueStatus(value: string | null | undefined): { label: string; tone: Tone } {
  if (!value) return { label: 'No due date', tone: 'neutral' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(value);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / DAY_MS);

  if (days < 0) return { label: 'Overdue', tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  if (days <= 2) return { label: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'accent' };
  return { label: formatDate(value), tone: 'neutral' };
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
