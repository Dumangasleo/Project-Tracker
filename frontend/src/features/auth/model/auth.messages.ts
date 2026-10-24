const SSO_ERRORS: Record<string, string> = {
  provider_denied: 'Sign-in was cancelled at the provider.',
  provider_unavailable: 'That sign-in provider is not configured.',
  email_not_verified: 'Your provider account has no verified email address.',
  state_missing: 'Your sign-in session expired. Please try again.',
  state_invalid: 'Your sign-in session expired. Please try again.',
  state_mismatch: 'We could not verify the sign-in request. Please try again.',
};

export function ssoErrorMessage(code: unknown): string | null {
  if (typeof code !== 'string' || !code) return null;
  return SSO_ERRORS[code] ?? 'Single sign-on failed. Please try again.';
}
