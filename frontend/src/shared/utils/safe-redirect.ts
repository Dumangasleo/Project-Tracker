/** Only same-app paths are allowed, so a crafted ?redirect= cannot send users to another site. */
export function safeRedirect(value: unknown, fallback = '/'): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback;
}
