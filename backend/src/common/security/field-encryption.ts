import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';
import type { ValueTransformer } from 'typeorm';

export const ENCRYPTED_PREFIX = 'enc1:';
/** Longest email whose ciphertext still fits the existing 255-character Email column. */
export const MAX_EMAIL_LENGTH = 150;
const IV_BYTES = 12;
const TAG_BYTES = 16;

interface FieldKeys {
  encryption: Buffer;
  index: Buffer;
}

let keys: FieldKeys | null = null;

export function configureFieldEncryption(secret: string): void {
  const material = Buffer.from(secret, 'utf8');
  const derive = (purpose: string) =>
    Buffer.from(hkdfSync('sha256', material, '', purpose, 32));
  keys = {
    encryption: derive('vortex-field-encryption'),
    index: derive('vortex-blind-index'),
  };
}

function currentKeys(): FieldKeys {
  if (!keys && process.env.DATA_ENCRYPTION_KEY) {
    configureFieldEncryption(process.env.DATA_ENCRYPTION_KEY);
  }
  if (!keys) throw new Error('DATA_ENCRYPTION_KEY is not configured.');
  return keys;
}

export const isEncrypted = (value: string): boolean =>
  value.startsWith(ENCRYPTED_PREFIX);

/** AES-256-GCM with a random IV, so the same input never produces the same output. */
export function encryptField(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', currentKeys().encryption, iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, body, cipher.getAuthTag()]).toString('base64')}`;
}

/** Values written before encryption was enabled are returned unchanged. */
export function decryptField(stored: string): string {
  if (!isEncrypted(stored)) return stored;

  const packed = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    currentKeys().encryption,
    packed.subarray(0, IV_BYTES),
  );
  decipher.setAuthTag(packed.subarray(packed.length - TAG_BYTES));
  return Buffer.concat([
    decipher.update(packed.subarray(IV_BYTES, packed.length - TAG_BYTES)),
    decipher.final(),
  ]).toString('utf8');
}

/** Deterministic keyed hash for equality lookups on an encrypted column. */
export function blindIndex(value: string): string {
  return createHmac('sha256', currentKeys().index).update(value).digest('hex');
}

export const emailLookupHash = (email: string): string =>
  blindIndex(email.trim().toLowerCase());

export const encryptedColumn: ValueTransformer = {
  to: (value: unknown) =>
    typeof value === 'string' && !isEncrypted(value)
      ? encryptField(value)
      : value,
  from: (value: unknown) =>
    typeof value === 'string' ? decryptField(value) : value,
};
