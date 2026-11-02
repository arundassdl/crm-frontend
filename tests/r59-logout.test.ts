/**
 * R59 — CRM logout is a global sign-out (doc 63).
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { GET as logoutGet, POST as logoutPost } from '../src/app/api/auth/logout/route';
import { GET as metricsGet } from '../src/app/api/dashboard/metrics/route';
import { middleware } from '../src/middleware';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';
import { invalidateTenantCache, resolveTenant } from '../src/lib/tenant-resolver';

const ROOT = join(__dirname, '..');
const origFetch = global.fetch;
const USER = 'evoqsdl7@mailinator.com';
const CTRL_NEXT = 'https://ctrl.evoq.app/api/auth/logout?continue=one';

function cookie(createdAt = Date.now(), user = USER): string {
  const s: CrmSession = {
    userId: user, evoqUserKey: 'USR-1', organization: 'TEAM-00076', application: 'crm',
    createdAt, expiresAt: createdAt + 3600_000,
  };
  return serializeSession(s);
}

function req(path: string, method = 'GET', session: string | null = cookie()): NextRequest {
  const headers: Record<string, string> = {};
  if (session) headers.Cookie = `${SESSION_COOKIE_NAME}=${session}; isLoggedIn=true; unrelated_pref=keep`;
  return new NextRequest(`https://crm.evoq.app${path}`, { method, headers });
}

function setCookies(res: Response): string[] {
  const h: any = res.headers;
  return h.getSetCookie ? h.getSetCookie() : [h.get('set-cookie') || ''];
}

type Call = { url: string; headers: Record<string, string>; body: any };

function mockCentral(handler: (url: string, body: any) => Response | Promise<Response>): Call[] {
  const calls: Call[] = [];
  global.fetch = (async (url: string, init: any = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, headers: init.headers || {}, body });
    return handler(url, body);
  }) as any;
  return calls;
}

const ok = (payload: unknown) => new Response(JSON.stringify({ message: payload }), { status: 200 });

describe('R59 logout button → global sign-out', () => {
  beforeEach(() => {
    process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret';
    invalidateTenantCache();
  });
  afterEach(() => {
    global.fetch = origFetch;
    delete process.env.INTERNAL_SERVICE_SECRET;
  });

  // R60: POST now answers with the logout page (see r60-logout.test.ts), not a 303 chain.
  test('POST signs the session user out at Central with the service secret, then shows the logout page', async () => {
    const calls = mockCentral(() => ok({ status: 'success', signed_out_before: 1, provider_outcome: 'ended' }));
    const res = await logoutPost(req('/api/auth/logout', 'POST'));

    assert.strictEqual(calls.length, 1);
    assert.match(calls[0].url, /internal_session\.global_logout$/);
    assert.strictEqual(calls[0].headers['X-Evoq-Internal-Secret'], 'test-internal-secret');
    assert.deepStrictEqual(calls[0].body, { user_id: USER, reason: 'crm_logout' });

    assert.strictEqual(res.status, 200);
    assert.match(await res.text(), /data-state="signed_out"/);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
    const cookies = setCookies(res);
    const session = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    assert.ok(session && /Max-Age=0/i.test(session) && /HttpOnly/i.test(session) && /Path=\//.test(session));
    assert.ok(!cookies.some((c) => c.startsWith('unrelated_pref=')), 'unrelated cookies are left alone');
    assert.ok(!/ticket|token|secret/i.test(res.headers.get('location') || ''));
  });

  test('the user signed out is the one in the signed cookie, not anything the browser sends', async () => {
    const calls = mockCentral(() => ok({ status: 'success' }));
    const r = new NextRequest('https://crm.evoq.app/api/auth/logout?user_id=victim@example.com', {
      method: 'POST',
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie()}`, 'X-Evoq-User': 'victim@example.com' },
    });
    await logoutPost(r);
    assert.strictEqual(calls[0].body.user_id, USER);
  });

  test('a forged or missing session signs nobody out but still clears and continues', async () => {
    const calls = mockCentral(() => ok({ status: 'success' }));
    const forged = cookie().replace(/\.[^.]+$/, '.forged-signature');
    for (const r of [req('/api/auth/logout', 'POST', forged), req('/api/auth/logout', 'POST', null)]) {
      const res = await logoutPost(r);
      assert.strictEqual(res.status, 200);
      assert.match(await res.text(), /data-state="signed_out"/);
    }
    assert.strictEqual(calls.length, 0);
  });

  test('Central unreachable: the CRM session still ends', async () => {
    mockCentral(() => { throw new Error('down'); });
    const res = await logoutPost(req('/api/auth/logout', 'POST'));
    assert.strictEqual(res.status, 200);
    assert.ok(setCookies(res).some((c) => c.startsWith(`${SESSION_COOKIE_NAME}=;`) || /evoq_crm_session=;/.test(c)));
  });

  test('GET (old links, prefetch) clears this browser only and never calls Central', async () => {
    const calls = mockCentral(() => ok({ status: 'success' }));
    const res = await logoutGet(req('/api/auth/logout'));
    assert.strictEqual(res.status, 303);
    assert.strictEqual(res.headers.get('location'), CTRL_NEXT);
    assert.strictEqual(calls.length, 0);
  });

  test('after logout, every CRM page goes to Evoq One sign-in (refresh, back, reopen)', () => {
    for (const path of ['/', '/org/TEAM-00076/', '/leads', '/deals']) {
      const res = middleware(req(path, 'GET', null));
      assert.strictEqual(res.status, 307);
      assert.match(res.headers.get('location') || '', /^https:\/\/one\.evoq\.app\/products\/crm\?signin=required/);
    }
  });
});

describe('R59 sessions from before a global sign-out', () => {
  beforeEach(() => invalidateTenantCache());
  afterEach(() => { global.fetch = origFetch; });

  test('the resolver is told when the CRM session began', async () => {
    const created = Date.now() - 5000;
    const calls = mockCentral(() => ok({ status: 'success', data: { backend_url: 'https://b.example', delegation_token: 't', user_id: USER } }));
    await resolveTenant(USER, 'TEAM-00076', 'crm', created);
    assert.strictEqual(calls[0].body.session_issued_at, created / 1000);
  });

  test('a cached answer for a new session is not reused for an older session', async () => {
    const calls = mockCentral(() => ok({ status: 'success', data: { backend_url: 'https://b.example', delegation_token: 't', user_id: USER } }));
    await resolveTenant(USER, 'TEAM-00076', 'crm', Date.now());
    await resolveTenant(USER, 'TEAM-00076', 'crm', Date.now() - 60_000);
    assert.strictEqual(calls.length, 2);
  });

  test('logout drops every cached resolution of the user', async () => {
    const calls = mockCentral(() => ok({ status: 'success', data: { backend_url: 'https://b.example', delegation_token: 't', user_id: USER } }));
    const t = Date.now();
    await resolveTenant(USER, 'TEAM-00076', 'crm', t);
    await resolveTenant(USER, 'TEAM-00099', 'crm', t);
    invalidateTenantCache(USER);
    await resolveTenant(USER, 'TEAM-00076', 'crm', t);
    await resolveTenant(USER, 'TEAM-00099', 'crm', t);
    assert.strictEqual(calls.length, 4);
  });

  test('an old CRM session is refused, its cookie is cleared and no data or token is returned', async () => {
    mockCentral(() =>
      new Response(
        JSON.stringify({ message: { status: 'error', error: { code: 'SESSION_REVOKED', message: 'You have signed out.', http_status: 401 } } }),
        { status: 401 },
      ),
    );
    const res = await metricsGet(req('/api/dashboard/metrics', 'GET', cookie(Date.now() - 600_000)));
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'SESSION_REVOKED');
    assert.strictEqual(body.kind, 'auth');
    assert.ok(!JSON.stringify(body).includes('delegation'));
    assert.ok(setCookies(res).some((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`) && /Max-Age=0/i.test(c)));
  });
});

describe('R59 UI', () => {
  test('the Logout button submits a POST, not a link', () => {
    const src = readFileSync(join(ROOT, 'src/components/layout/shared/UserDropdown.tsx'), 'utf8');
    assert.match(src, /form\.method = 'POST'/);
    assert.match(src, /form\.action = '\/api\/auth\/logout'/);
    assert.ok(!/window\.location\.href = '\/api\/auth\/logout'/.test(src));
  });

  test('every CRM page reloads when restored from the back/forward cache', () => {
    const shell = readFileSync(join(ROOT, 'src/components/CrmShell.tsx'), 'utf8');
    const guard = readFileSync(join(ROOT, 'src/components/BackNavigationGuard.tsx'), 'utf8');
    assert.match(shell, /<BackNavigationGuard \/>/);
    assert.match(guard, /event\.persisted\) window\.location\.reload\(\)/);
  });
});

describe('R59 page-level refusal of a signed-out session', () => {
  test('a revoked session gets no CRM page: session-ended clears the cookie and goes to Evoq One sign-in', async () => {
    const { GET } = await import('../src/app/api/auth/session-ended/route');
    const res = await GET(new NextRequest('https://crm.evoq.app/api/auth/session-ended?next=%2Fleads'));
    assert.strictEqual(res.status, 303);
    assert.strictEqual(res.headers.get('location'), 'https://one.evoq.app/products/crm?signin=required&next=%2Fleads');
    assert.ok(setCookies(res).some((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`) && /Max-Age=0/i.test(c)));
    const bad = await GET(new NextRequest('https://crm.evoq.app/api/auth/session-ended?next=https%3A%2F%2Fevil.com'));
    assert.strictEqual(bad.headers.get('location'), 'https://one.evoq.app/products/crm?signin=required');
  });

  test('the shared CRM page frame checks the session with Central before rendering', () => {
    const shell = readFileSync(join(ROOT, 'src/components/CrmShell.tsx'), 'utf8');
    assert.match(shell, /resolveTenant\(userId, organization, application, createdAt\)/);
    assert.match(shell, /err\.code === 'SESSION_REVOKED'/);
    assert.match(shell, /redirect\(`\/api\/auth\/session-ended/);
  });

  test('middleware passes the page path to server components, and still redirects without a session', () => {
    const res = middleware(req('/leads', 'GET', cookie()));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-middleware-request-x-evoq-path'), '/leads');
  });
});
