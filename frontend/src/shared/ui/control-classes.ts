export const controlClass = [
  'w-full rounded-lg border bg-surface px-3 text-sm text-fg shadow-xs transition-colors',
  'placeholder:text-fg-subtle',
  'focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-muted',
].join(' ');

export const controlBorder = (invalid?: boolean) =>
  invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : 'border-line';
