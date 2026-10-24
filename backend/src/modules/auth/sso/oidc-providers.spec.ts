import { buildOidcProviders, type SsoEnv } from './oidc-providers';
import { SsoProvider } from './sso-provider.enum';

const env: SsoEnv = {
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  MICROSOFT_CLIENT_ID: 'ms-id',
  MICROSOFT_CLIENT_SECRET: 'ms-secret',
  MICROSOFT_TENANT_ID: 'common',
};

const CONSUMER_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad';
const WORK_TENANT = '11111111-2222-3333-4444-555555555555';

describe('OIDC providers', () => {
  const providers = buildOidcProviders(env);
  const google = providers.get(SsoProvider.Google)!;
  const microsoft = providers.get(SsoProvider.Microsoft)!;

  it('only enables providers that have credentials', () => {
    const onlyGoogle = buildOidcProviders({
      ...env,
      MICROSOFT_CLIENT_ID: undefined,
    });
    expect([...onlyGoogle.keys()]).toEqual([SsoProvider.Google]);
  });

  describe('google', () => {
    it('maps a verified email to an identity', () => {
      expect(
        google.toIdentity({
          sub: 'g-1',
          email: 'juan@gmail.com',
          email_verified: true,
          given_name: 'Juan',
          family_name: 'Dela Cruz',
        }),
      ).toEqual({
        subject: 'g-1',
        email: 'juan@gmail.com',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
      });
    });

    it('rejects an unverified email', () => {
      expect(
        google.toIdentity({
          sub: 'g-1',
          email: 'juan@gmail.com',
          email_verified: false,
        }),
      ).toBeNull();
    });

    it('trusts only Google issuers', () => {
      expect(
        google.isTrustedIssuer({ iss: 'https://accounts.google.com' }),
      ).toBe(true);
      expect(google.isTrustedIssuer({ iss: 'https://evil.example.com' })).toBe(
        false,
      );
    });
  });

  describe('microsoft', () => {
    it('accepts personal accounts by preferred_username', () => {
      const identity = microsoft.toIdentity({
        sub: 'm-1',
        tid: CONSUMER_TENANT,
        preferred_username: 'juan@outlook.com',
        name: 'Juan Dela Cruz',
      });
      expect(identity?.email).toBe('juan@outlook.com');
      expect(identity?.firstName).toBe('Juan');
    });

    it('rejects work-account emails without the xms_edov claim', () => {
      expect(
        microsoft.toIdentity({
          sub: 'm-2',
          tid: WORK_TENANT,
          email: 'juan@company.com',
        }),
      ).toBeNull();
      expect(
        microsoft.toIdentity({
          sub: 'm-2',
          tid: WORK_TENANT,
          email: 'juan@company.com',
          xms_edov: true,
        })?.email,
      ).toBe('juan@company.com');
    });

    it('requires the issuer to match the token tenant', () => {
      expect(
        microsoft.isTrustedIssuer({
          tid: WORK_TENANT,
          iss: `https://login.microsoftonline.com/${WORK_TENANT}/v2.0`,
        }),
      ).toBe(true);
      expect(
        microsoft.isTrustedIssuer({
          tid: WORK_TENANT,
          iss: `https://login.microsoftonline.com/${CONSUMER_TENANT}/v2.0`,
        }),
      ).toBe(false);
    });
  });
});
