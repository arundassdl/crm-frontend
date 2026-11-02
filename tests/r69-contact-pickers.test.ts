/**
 * R69 — Contact pickers (link search) offer customer contacts only, like the Contacts list (R68).
 * Team members stay selectable only when a workflow asks for them explicitly; other doctypes are untouched.
 */
import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';
import { invalidateTenantCache } from '../src/lib/tenant-resolver';
import { POST as searchLink } from '../src/app/api/search-link/route';

const ROOT = join(__dirname, '..');
const origFetch = global.fetch;
const RULE = [['Contact', 'user', 'is', 'not set']];

function cookie(): string {
  const now = Date.now();
  const s: CrmSession = { userId: 'evoqsdl7@mailinator.com', evoqUserKey: 'USR-1', organization: 'TEAM-00076', application: 'crm', createdAt: now, expiresAt: now + 3600_000 };
  return serializeSession(s);
}
type Call = { method: string; body: any };
function mockTenant(): Call[] {
  const calls: Call[] = [];
  global.fetch = (async (url: string, init: any = {}) => {
    if (url.includes('internal_tenant_resolver.resolve')) {
      return new Response(JSON.stringify({ status: 'success', data: { user_id: 'evoqsdl7@mailinator.com', evoq_user_key: 'USR-1', organization: 'TEAM-00076', application: 'crm', backend_url: 'https://crm.team-00076.evoq.app', delegation_token: 't', delegation_token_expires_in: 300, cache_ttl_seconds: 60 } }), { status: 200 });
    }
    const method = new URL(url).pathname.replace('/api/method/', '');
    calls.push({ method, body: typeof init.body === 'string' ? JSON.parse(init.body) : init.body });
    return new Response(JSON.stringify({ message: [{ value: 'C-1' }] }), { status: 200 });
  }) as any;
  return calls;
}
const search = (body: object, withSession = true) =>
  searchLink(new NextRequest('https://crm.evoq.app/api/search-link', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(withSession ? { Cookie: `${SESSION_COOKIE_NAME}=${cookie()}` } : {}) },
  }));

describe('R69 Contact pickers', () => {
  beforeEach(() => { process.env.INTERNAL_SERVICE_SECRET = 's'; invalidateTenantCache(); });
  afterEach(() => { global.fetch = origFetch; delete process.env.INTERNAL_SERVICE_SECRET; });

  test('a Contact search leaves team members out by default', async () => {
    const calls = mockTenant();
    const res = await search({ module: 'Contact', txt: 'ann' });
    assert.strictEqual(res.status, 200);
    const c = calls.find((x) => x.method === 'frappe.desk.search.search_link')!;
    assert.deepStrictEqual(JSON.parse(c.body.filters), RULE);
    assert.strictEqual(c.body.txt, 'ann');
  });
  test('only an explicit true includes team members', async () => {
    let calls = mockTenant();
    await search({ module: 'Contact', txt: '', include_team_members: true });
    assert.strictEqual(calls.find((x) => x.method === 'frappe.desk.search.search_link')!.body.filters, undefined);
    for (const v of [false, 'true', 1]) {
      calls = mockTenant();
      await search({ module: 'Contact', txt: '', include_team_members: v });
      assert.deepStrictEqual(JSON.parse(calls.find((x) => x.method === 'frappe.desk.search.search_link')!.body.filters), RULE, String(v));
    }
  });
  test('other link searches (User, CRM Organization, CRM Lead) are untouched', async () => {
    for (const m of ['User', 'CRM Organization', 'CRM Lead']) {
      const calls = mockTenant();
      await search({ module: m, txt: 'a' });
      assert.strictEqual(calls.find((x) => x.method === 'frappe.desk.search.search_link')!.body.filters, undefined, m);
    }
  });
  test('the rule never looks at email', async () => {
    const calls = mockTenant();
    await search({ module: 'Contact', txt: 'owner@example.com' });
    assert.ok(!JSON.stringify(calls.at(-1)!.body.filters).includes('email'));
  });
  test('without a session nothing reaches the tenant', async () => {
    const calls = mockTenant();
    const res = await search({ module: 'Contact', txt: '' }, false);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(calls.length, 0);
  });
});

describe('R69 picker wiring', () => {
  const src = (p: string) => readFileSync(join(ROOT, 'src', p), 'utf8');
  test('CommonSearchField defaults to customer contacts and offers an explicit option', () => {
    const s = src('components/Common/CommonSearchField.tsx');
    assert.match(s, /includeTeamMembers = false/);
    assert.match(s, /\{ include_team_members: includeTeamMembers \}/);
  });
  test('the client sends include_team_members only when it is true', () => {
    assert.match(src('services/api/common-erpnext-api/listing-api-get.ts'), /options\.include_team_members === true && \{ include_team_members: true \}/);
  });
  test('the Deal form contact picker uses the default (customer contacts)', () => {
    const s = src('components/Deals/CreateEdit.tsx');
    assert.match(s, /doctype:"Contact"/);
    assert.ok(!/includeTeamMembers/.test(s));
  });
});
