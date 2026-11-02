import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  CrmSession,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  parseSession,
  serializeSession,
} from '../src/lib/session';

describe('BFF Session Security & Host-Only Cookie Policy (doc 28 §3)', () => {
  test('serializes and parses valid session correctly', () => {
    const now = Date.now();
    const session: CrmSession = {
      userId: 'arun@example.com',
      evoqUserKey: 'USR-ABCD1234EF',
      organization: 'team-12345',
      application: 'crm',
      createdAt: now,
      expiresAt: now + 86400 * 1000,
    };

    const cookieVal = serializeSession(session);
    assert.ok(cookieVal);
    assert.ok(cookieVal.includes('.'));

    const parsed = parseSession(cookieVal);
    assert.deepStrictEqual(parsed, session);
  });

  test('rejects tampered cookie signature', () => {
    const now = Date.now();
    const session: CrmSession = {
      userId: 'arun@example.com',
      evoqUserKey: 'USR-ABCD1234EF',
      organization: 'team-12345',
      application: 'crm',
      createdAt: now,
      expiresAt: now + 86400 * 1000,
    };

    const cookieVal = serializeSession(session);
    const [payload, sig] = cookieVal.split('.');

    // Tamper with payload (modify organization)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...session, organization: 'team-99999' }),
    ).toString('base64url');

    const tamperedCookie = `${tamperedPayload}.${sig}`;
    const parsed = parseSession(tamperedCookie);
    assert.strictEqual(parsed, null);
  });

  test('rejects expired session', () => {
    const now = Date.now();
    const session: CrmSession = {
      userId: 'arun@example.com',
      evoqUserKey: 'USR-ABCD1234EF',
      organization: 'team-12345',
      application: 'crm',
      createdAt: now - 100000,
      expiresAt: now - 1000, // expired 1s ago
    };

    const cookieVal = serializeSession(session);
    const parsed = parseSession(cookieVal);
    assert.strictEqual(parsed, null);
  });

  test('rejects invalid or malformed cookies', () => {
    assert.strictEqual(parseSession(undefined), null);
    assert.strictEqual(parseSession(''), null);
    assert.strictEqual(parseSession('not-a-valid-cookie'), null);
    assert.strictEqual(parseSession('invalid.signature.extra'), null);
  });

  test('cookie options strictly enforce host-only and httpOnly policy', () => {
    const options = getSessionCookieOptions(true);
    assert.strictEqual(options.httpOnly, true);
    assert.strictEqual(options.secure, true);
    assert.strictEqual(options.sameSite, 'lax');
    assert.strictEqual(options.path, '/');
    // Invariant: Do NOT specify domain to keep cookie host-only
    assert.strictEqual((options as any).domain, undefined);
  });
});
