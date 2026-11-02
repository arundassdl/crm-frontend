import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/auth/launch/route';
import { SESSION_COOKIE_NAME, parseSession } from '../src/lib/session';

const origFetch = global.fetch;

describe('BFF Launch Ticket Endpoint & Open-Redirect Protection (doc 28 §3)', () => {
  afterEach(() => {
    global.fetch = origFetch;
  });

  test('happy path: redeems launch ticket, sets host-only cookie, and redirects', async () => {
    global.fetch = (async (url: string, init: any) => {
      assert.ok(url.includes('evoq_saas_package_layer.api.internal_launch_tickets.redeem'));
      const body = JSON.parse(init.body);
      assert.strictEqual(body.ticket, 'valid-ticket-123');
      assert.strictEqual(body.application, 'crm');

      return new Response(
        JSON.stringify({
          status: 'success',
          session: {
            user_id: 'arun@example.com',
            evoq_user_key: 'USR-ABCD1234EF',
            organization: 'team-acme',
            application: 'crm',
            callback_path: '/org/team-acme/deals',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    const req = new NextRequest(
      'https://crm.evoq.app/api/auth/launch?ticket=valid-ticket-123&return_to=/org/team-acme/deals',
    );

    const res = await GET(req);
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/org/team-acme/deals');

    // Verify cookie was set via res.cookies
    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    assert.ok(cookie);
    assert.strictEqual(cookie?.httpOnly, true);
    assert.strictEqual(cookie?.sameSite?.toLowerCase(), 'lax');
    assert.strictEqual(cookie?.path, '/');
    assert.strictEqual((cookie as any).domain, undefined); // Host-only, no domain

    // Verify session payload
    const session = parseSession(cookie?.value);
    assert.ok(session);
    assert.strictEqual(session?.userId, 'arun@example.com');
    assert.strictEqual(session?.organization, 'team-acme');
    assert.strictEqual(session?.evoqUserKey, 'USR-ABCD1234EF');
  });

  test('missing ticket returns 400 Bad Request', async () => {
    const req = new NextRequest('https://crm.evoq.app/api/auth/launch');
    const res = await GET(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'MISSING_TICKET');
  });

  test('replayed or invalid ticket returns 401', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          code: 'TICKET_INVALID_OR_EXPIRED',
          message: 'Launch ticket is invalid or has expired.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    const req = new NextRequest('https://crm.evoq.app/api/auth/launch?ticket=expired-token');
    const res = await GET(req);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error, 'TICKET_INVALID_OR_EXPIRED');
  });

  test('application mismatch returns 403', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          code: 'APPLICATION_MISMATCH',
          message: 'Launch ticket was issued for a different application.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    const req = new NextRequest('https://crm.evoq.app/api/auth/launch?ticket=fsm-token');
    const res = await GET(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, 'APPLICATION_MISMATCH');
  });

  test('open redirect attempts are sanitized to organization root', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: 'success',
          session: {
            user_id: 'arun@example.com',
            organization: 'team-acme',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    // 1. External domain attack
    let req = new NextRequest(
      'https://crm.evoq.app/api/auth/launch?ticket=tok&return_to=https://evil.com/phish',
    );
    let res = await GET(req);
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/org/team-acme/');

    // 2. Protocol relative attack
    req = new NextRequest('https://crm.evoq.app/api/auth/launch?ticket=tok&return_to=//evil.com/path');
    res = await GET(req);
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/org/team-acme/');

    // 3. Cross-organization traversal attack
    req = new NextRequest(
      'https://crm.evoq.app/api/auth/launch?ticket=tok&return_to=/org/team-OTHER/deals',
    );
    res = await GET(req);
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/org/team-acme/');

    // 4. Backslash bypass attack
    req = new NextRequest(
      'https://crm.evoq.app/api/auth/launch?ticket=tok&return_to=/org/team-acme\\evil',
    );
    res = await GET(req);
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/org/team-acme/');
  });
});
