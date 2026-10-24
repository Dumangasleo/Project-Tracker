export type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export interface Option<T> {
  value: T;
  label: string;
}

export interface ToneOption<T> extends Option<T> {
  tone: Tone;
}

export function findOption<T, O extends Option<T>>(options: readonly O[], value: T): O | undefined {
  return options.find((option) => option.value === value);
}
