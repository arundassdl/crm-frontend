/**
 * R63 — CRM user management through sdl_user_management 2.0 (doc 67).
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';
import { invalidateTenantCache } from '../src/lib/tenant-resolver';
import { GET as meGet, POST as mePost } from '../src/app/api/account/me/route';
import { GET as usersGet } from '../src/app/api/user-management/users/route';
import { POST as profilePost } from '../src/app/api/user-management/role-profile/route';
import { POST as statusPost } from '../src/app/api/user-management/status/route';
import { GET as profilesGet } from '../src/app/api/user-management/role-profiles/route';

const ROOT = join(__dirname, '..');
const origFetch = global.fetch;
const BACKEND = 'https://crm.team-00076.evoq.app';
type Call = { url: string; method: string; body: any; headers: Headers };

function cookie(): string {
  const now = Date.now();
  const s: CrmSession = { userId: 'evoqsdl7@mailinator.com', evoqUserKey: 'USR-1', organization: 'TEAM-00076', application: 'crm', createdAt: now, expiresAt: now + 3600_000 };
  return serializeSession(s);
}
function req(path: string, method = 'GET', body?: unknown): NextRequest {
  return new NextRequest(`https://crm.evoq.app${path}`, {
    method, headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function mock(tenant: (method: string, call: Call) => [number, any]): Call[] {
  const calls: Call[] = [];
  global.fetch = (async (url: string, init: any = {}) => {
    if (url.includes('internal_tenant_resolver.resolve')) {
      return new Response(JSON.stringify({ message: { status: 'success', data: { user_id: 'evoqsdl7@mailinator.com', evoq_user_key: 'USR-1', organization: 'TEAM-00076', application: 'crm', backend_url: BACKEND, delegation_token: 'secret-delegation', cache_ttl_seconds: 60 } } }), { status: 200 });
    }
    const u = new URL(url);
    const call: Call = { url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : Object.fromEntries(u.searchParams), headers: new Headers(init.headers) };
    calls.push(call);
    const [status, body] = tenant(u.pathname.replace('/api/method/', ''), call);
    return new Response(JSON.stringify(body), { status });
  }) as any;
  return calls;
}

describe('R63 user-management BFF', () => {
  beforeEach(() => { process.env.INTERNAL_SERVICE_SECRET = 's'; invalidateTenantCache(); });
  afterEach(() => { global.fetch = origFetch; delete process.env.INTERNAL_SERVICE_SECRET; });

  test('My Account reads the tenant me() through the delegated session; no token reaches the browser', async () => {
    const calls = mock(() => [200, { message: { user: 'evoqsdl7@mailinator.com', role_profile: 'EVOQ CRM Manager' } }]);
    const res = await meGet(req('/api/account/me'));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(calls[0].url.split('?')[0], `${BACKEND}/api/method/sdl_user_management.um.me`);
    assert.strictEqual(calls[0].headers.get('X-Evoq-Delegation-Token'), 'secret-delegation');
    const text = JSON.stringify(await res.json());
    assert.ok(!text.includes('secret-delegation'));
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
  });

  test('My Account update sends only first/last name', async () => {
    const calls = mock(() => [200, { message: { user: 'x' } }]);
    await mePost(req('/api/account/me', 'POST', { first_name: 'A', last_name: 'B', role_profile: 'EVOQ CRM Manager', email: 'evil@example.com', enabled: 1 }));
    assert.deepStrictEqual(calls[0].body, { first_name: 'A', last_name: 'B' });
    assert.match(calls[0].url, /sdl_user_management\.um\.update_me$/);
  });

  test('role profile: only approved profiles and a valid user leave the BFF', async () => {
    const calls = mock(() => [200, { message: {} }]);
    for (const bad of [{ user: 'a@b.co', role_profile: 'System Manager' }, { user: 'a@b.co', role_profile: '' }, { user: 'not-an-email', role_profile: 'EVOQ CRM User' }, { user: 'a@b.co' }]) {
      const res = await profilePost(req('/api/user-management/role-profile', 'POST', bad));
      assert.strictEqual(res.status, 400, JSON.stringify(bad));
    }
    assert.strictEqual(calls.length, 0, 'nothing invalid reaches the tenant');
    const ok = await profilePost(req('/api/user-management/role-profile', 'POST', { user: 'member@example.com', role_profile: 'EVOQ CRM Manager' }));
    assert.strictEqual(ok.status, 200);
    assert.deepStrictEqual(calls[0].body, { user: 'member@example.com', role_profile: 'EVOQ CRM Manager' });
  });

  test('status requires a boolean and maps it to 1/0', async () => {
    const calls = mock(() => [200, { message: {} }]);
    assert.strictEqual((await statusPost(req('/api/user-management/status', 'POST', { user: 'm@example.com', active: 'no' }))).status, 400);
    await statusPost(req('/api/user-management/status', 'POST', { user: 'm@example.com', active: false }));
    assert.deepStrictEqual(calls[0].body, { user: 'm@example.com', active: 0 });
  });

  test("the tenant's refusal is passed on (403), not hidden", async () => {
    mock(() => [403, { exc_type: 'NotAllowed', _server_messages: JSON.stringify([JSON.stringify({ message: 'Only a CRM manager in your organization can manage users.' })]) }]);
    const res = await usersGet(req('/api/user-management/users'));
    assert.strictEqual(res.status, 403);
    assert.match((await res.json()).message, /Only a CRM manager/);
  });

  test('a tenant without the app answers "not available yet" (503)', async () => {
    mock(() => [417, { exc_type: 'ValidationError', _server_messages: JSON.stringify([JSON.stringify({ message: 'App sdl_user_management is not installed' })]) }]);
    for (const res of [await meGet(req('/api/account/me')), await profilesGet(req('/api/user-management/role-profiles'))]) {
      assert.strictEqual(res.status, 503);
      const body = await res.json();
      assert.strictEqual(body.error, 'USER_MANAGEMENT_UNAVAILABLE');
      assert.ok(!/sdl_user_management/.test(body.message), 'no internal names in customer copy');
    }
  });

  test('users list clamps paging and search', async () => {
    const calls = mock(() => [200, { message: { users: [], total: 0 } }]);
    await usersGet(req(`/api/user-management/users?page_length=5000&start=-3&status=evil&search=${'x'.repeat(500)}`));
    assert.strictEqual(calls[0].body.page_length, '100');
    assert.strictEqual(calls[0].body.start, '0');
    assert.strictEqual(calls[0].body.status, undefined);
    assert.strictEqual(calls[0].body.search.length, 100);
  });

  test('no session → 401 and nothing reaches the tenant', async () => {
    const calls = mock(() => [200, {}]);
    const res = await meGet(new NextRequest('https://crm.evoq.app/api/account/me'));
    assert.strictEqual(res.status, 401);
    assert.strictEqual(calls.length, 0);
  });
});

describe('R63 screens', () => {
  const src = (p: string) => readFileSync(join(ROOT, 'src', p), 'utf8');
  test('pages use the secured components, not the legacy SalesBond services', () => {
    assert.match(src('app/(dashboard)/my-account/page.tsx'), /UserManagement\/MyAccount/);
    assert.match(src('app/user/users/page.tsx'), /UserManagement\/UsersPanel/);
    assert.match(src('app/user/roles/page.tsx'), /UserManagement\/RoleProfilesPanel/);
    for (const p of ['components/UserManagement/MyAccount.tsx', 'components/UserManagement/UsersPanel.tsx', 'components/UserManagement/RoleProfilesPanel.tsx']) {
      assert.ok(!/sdl_user_management\.sdk|api\/proxy|localStorage/.test(src(p)), p);
    }
  });
  test('users cannot act on themselves in the UI; people are invited in CTRL', () => {
    const u = src('components/UserManagement/UsersPanel.tsx');
    assert.match(u, /const locked = self \|\| !!u\.is_owner/);
    assert.match(u, /disabled=\{locked\}/);
    assert.match(u, /\{!locked && \(/);
    assert.match(u, /Invite people to your organization in EVOQ CTRL/);
  });
  test('R64: the organization owner is badged and cannot be changed from CRM', () => {
    const u = src('components/UserManagement/UsersPanel.tsx');
    assert.match(u, /is_owner\?: boolean/);
    assert.match(u, /label='Owner'/);
    assert.match(u, /Managed in EVOQ/);
  });
  test('R64: legacy user and role screens redirect to the single secured screen', () => {
    const { readdirSync, statSync } = require('node:fs');
    const pages: string[] = [];
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : f === 'page.tsx' && pages.push(p) } };
    for (const d of ['app/roles', 'app/user/roles', 'app/user/users']) walk(join(ROOT, 'src', d));
    const legacy = pages.filter(p => !/app\/user\/(roles|users)\/page\.tsx$/.test(p));
    assert.strictEqual(legacy.length, 10);
    const cfg = readFileSync(join(ROOT, 'next.config.js'), 'utf8');
    for (const src of ["'/roles'", "'/roles/:rest(add|edit/.*|detail/.*)'", "'/user/roles/:rest(add|edit/.*|detail/.*)'", "'/user/users/:rest(add|edit/.*|detail/.*)'"]) assert.ok(cfg.includes(`source: ${src}`), src);
    for (const p of legacy) {
      const s = readFileSync(p, 'utf8');
      assert.match(s, /redirect\('\/user\/(roles|users)'\)/, p);
      assert.ok(!/components\/(roles|Users)\//.test(s), p);
    }
  });
});
