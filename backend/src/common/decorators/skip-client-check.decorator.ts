import { SetMetadata } from '@nestjs/common';

export const SKIP_CLIENT_CHECK_KEY = 'skipClientCheck';

/** For browser navigations (SSO redirects) and probes that cannot send custom headers. */
export const SkipClientCheck = () => SetMetadata(SKIP_CLIENT_CHECK_KEY, true);
