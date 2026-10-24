import { createHmac } from 'node:crypto';
import { isValidSignature } from './gitea-webhook.controller';

const secret = 'webhook-secret';
const body = Buffer.from('{"action":"opened"}');
const sign = (payload: Buffer, key = secret) =>
  createHmac('sha256', key).update(payload).digest('hex');

describe('isValidSignature', () => {
  it('accepts the signature Gitea computes over the raw body', () => {
    expect(isValidSignature(body, sign(body), secret)).toBe(true);
  });

  it('rejects a missing, malformed, tampered or wrongly keyed signature', () => {
    expect(isValidSignature(body, undefined, secret)).toBe(false);
    expect(isValidSignature(body, 'not-hex', secret)).toBe(false);
    expect(
      isValidSignature(Buffer.from('{"action":"closed"}'), sign(body), secret),
    ).toBe(false);
    expect(isValidSignature(body, sign(body, 'other-secret'), secret)).toBe(
      false,
    );
  });
});
