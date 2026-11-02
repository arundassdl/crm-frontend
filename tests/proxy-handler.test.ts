import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/proxy/[...path]/route';
import {
  CrmSession,
  SESSION_COOKIE_NAME,
  serializeSession,
} from '../src/lib/session';
import { invalidateTenantCache } from '../src/lib/tenant-resolver';

const origFetch = global.fetch;

function makeSessionCookie(org: string = 'team-acme'): string {
  const session: CrmSession = {
    userId: 'arun@example.com',
    evoqUserKey: 'USR-ABCD1234EF',
    organization: org,
    application: 'crm',
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400 * 1000,
  };
  return serializeSession(session);
}

describe('BFF Tenant Proxy & Security Boundary (doc 28 §4.4, §11)', () => {
  beforeEach(() => {
    invalidateTenantCache();
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  test('unauthenticated request without session cookie is rejected with 401', async () => {
    const req = new NextRequest('https://crm.evoq.app/api/proxy/api/method/ping');
    const res = await GET(req, { params: { path: ['api', 'method', 'ping'] } });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error, 'UNAUTHORIZED');
  });

  test('cross-organization access attempt (IDOR) is rejected with 403', async () => {
    const cookie = makeSessionCookie('team-acme');
    const req = new NextRequest('https://crm.evoq.app/api/proxy/api/method/deals', {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${cookie}`,
        'X-Organization-Id': 'team-OTHER-ROGUE',
      },
    });

    const res = await GET(req, { params: { path: ['api', 'method', 'deals'] } });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, 'ORGANIZATION_FORBIDDEN');
  });

  test('successful proxy: injects delegation token & user key, strips spoofed headers', async () => {
    let resolverCalled = false;
    let backendCalled = false;
    let backendHeaders: Headers | null = null;

    global.fetch = (async (url: string, init: any) => {
      if (url.includes('evoq_saas_package_layer.api.internal_tenant_resolver.resolve')) {
        resolverCalled = true;
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              user_id: 'arun@example.com',
              evoq_user_key: 'USR-ABCD1234EF',
              organization: 'team-acme',
              application: 'crm',
              backend_url: 'https://crm.team-acme.evoq.app',
              delegation_token: 'secret-rs256-jwt-token-123',
              delegation_token_expires_in: 300,
              cache_ttl_seconds: 60,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.startsWith('https://crm.team-acme.evoq.app/api/method/leads')) {
        backendCalled = true;
        backendHeaders = new Headers(init.headers);
        return new Response(
          JSON.stringify({ message: [{ name: 'Lead 001' }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      throw new Error(`Unexpected fetch call to ${url}`);
    }) as any;

    const cookie = makeSessionCookie('team-acme');
    const req = new NextRequest('https://crm.evoq.app/api/proxy/api/method/leads', {
      method: 'POST',
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${cookie}`,
        'Content-Type': 'application/json',
        // Attempt to spoof delegation token and auth from browser
        'X-Evoq-Delegation-Token': 'attacker-fake-jwt',
        Authorization: 'Bearer attacker-token',
      },
      body: JSON.stringify({ doctype: 'Lead' }),
    });

    const res = await POST(req, { params: { path: ['api', 'method', 'leads'] } });
    assert.strictEqual(res.status, 200);
    assert.ok(resolverCalled);
    assert.ok(backendCalled);

    // Verify backend received Central-minted token, NOT attacker token
    assert.strictEqual(
      backendHeaders?.get('X-Evoq-Delegation-Token'),
      'secret-rs256-jwt-token-123',
    );
    assert.strictEqual(
      backendHeaders?.get('X-Evoq-User-Key'),
      'USR-ABCD1234EF',
    );
    // Attacker's authorization header was stripped
    assert.strictEqual(backendHeaders?.get('Authorization'), null);

    // Invariant: Response to browser NEVER leaks delegation token
    const resText = await res.text();
    assert.ok(!resText.includes('secret-rs256-jwt-token-123'));
    assert.strictEqual(res.headers.get('x-evoq-delegation-token'), null);
  });

  test('suspended subscription propagates 402 with remediation url', async () => {
    global.fetch = (async (url: string) => {
      if (url.includes('evoq_saas_package_layer.api.internal_tenant_resolver.resolve')) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: {
              code: 'SUBSCRIPTION_SUSPENDED',
              message: 'Subscription is suspended.',
              http_status: 402,
              remediation_url: 'https://ctrl.evoq.app/billing',
            },
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected url ${url}`);
    }) as any;

    const cookie = makeSessionCookie('team-acme');
    const req = new NextRequest('https://crm.evoq.app/api/proxy/api/method/deals', {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie}` },
    });

    const res = await GET(req, { params: { path: ['api', 'method', 'deals'] } });
    assert.strictEqual(res.status, 402);
    const data = await res.json();
    assert.strictEqual(data.error, 'SUBSCRIPTION_SUSPENDED');
    assert.strictEqual(data.remediation_url, 'https://ctrl.evoq.app/billing');
  });

  test('tenant site not ready propagates 503', async () => {
    global.fetch = (async (url: string) => {
      if (url.includes('evoq_saas_package_layer.api.internal_tenant_resolver.resolve')) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: {
              code: 'TENANT_SITE_NOT_READY',
              message: 'Tenant site is restarting.',
              http_status: 503,
            },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected url ${url}`);
    }) as any;

    const cookie = makeSessionCookie('team-acme');
    const req = new NextRequest('https://crm.evoq.app/api/proxy/api/method/deals', {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie}` },
    });

    const res = await GET(req, { params: { path: ['api', 'method', 'deals'] } });
    assert.strictEqual(res.status, 503);
    const data = await res.json();
    assert.strictEqual(data.error, 'TENANT_SITE_NOT_READY');
  });
});
