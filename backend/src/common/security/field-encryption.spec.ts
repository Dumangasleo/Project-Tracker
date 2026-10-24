import {
  configureFieldEncryption,
  decryptField,
  emailLookupHash,
  encryptedColumn,
  encryptField,
  ENCRYPTED_PREFIX,
  MAX_EMAIL_LENGTH,
} from './field-encryption';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('field encryption', () => {
  beforeEach(() => configureFieldEncryption(SECRET));

  it('round-trips a value and never stores the plain text', () => {
    const stored = encryptField('juan@example.com');

    expect(stored.startsWith(ENCRYPTED_PREFIX)).toBe(true);
    expect(stored).not.toContain('juan');
    expect(decryptField(stored)).toBe('juan@example.com');
  });

  it('produces a different ciphertext every time', () => {
    expect(encryptField('same')).not.toBe(encryptField('same'));
  });

  it('returns legacy plain-text values unchanged', () => {
    expect(decryptField('09171234567')).toBe('09171234567');
  });

  it('rejects ciphertext that was tampered with or made with another key', () => {
    const stored = encryptField('secret');
    const tampered = `${stored.slice(0, -4)}${stored.endsWith('AAAA') ? 'BBBB' : 'AAAA'}`;
    expect(() => decryptField(tampered)).toThrow();

    configureFieldEncryption('another-secret-that-is-at-least-32-characters');
    expect(() => decryptField(stored)).toThrow();
  });

  it('builds the same lookup hash regardless of case or spaces', () => {
    expect(emailLookupHash(' Juan@Example.com ')).toBe(
      emailLookupHash('juan@example.com'),
    );
    expect(emailLookupHash('juan@example.com')).toHaveLength(64);
    expect(emailLookupHash('juan@example.com')).not.toBe(
      emailLookupHash('maria@example.com'),
    );
  });

  it('keeps the longest allowed email within the 255-character column', () => {
    const longest = `${'a'.repeat(MAX_EMAIL_LENGTH - 12)}@example.com`;
    expect(encryptField(longest).length).toBeLessThanOrEqual(255);
  });

  it('transformer encrypts strings once and leaves other values alone', () => {
    const to = (value: unknown): unknown => encryptedColumn.to(value);
    const from = (value: unknown): unknown => encryptedColumn.from(value);

    const stored = to('0917') as string;
    expect(to(stored)).toBe(stored);
    expect(from(stored)).toBe('0917');
    expect(to(null)).toBeNull();
    expect(from(undefined)).toBeUndefined();
  });
});
