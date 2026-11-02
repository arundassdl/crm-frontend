/**
 * R68 — internal team-member Contacts are kept but left out of customer-facing Contact lists and counts.
 * A Contact linked to a sign-in user of the tenant (`Contact.user` set) is a team member; the link decides,
 * never the email.
 */
import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';
import { invalidateTenantCache } from '../src/lib/tenant-resolver';
import { CUSTOMER_CONTACTS_ONLY, buildListArgs } from '../src/lib/frappe-list';
import { POST as datalist } from '../src/app/api/datalist/route';
import { GET as metrics } from '../src/app/api/dashboard/metrics/route';

const ROOT = join(__dirname, '..');
const origFetch = global.fetch;
const BACKEND = 'https://crm.team-00076.evoq.app';
const RULE = ['Contact', 'user', 'is', 'not set'];

function cookie(): string {
  const now = Date.now();
  const s: CrmSession = { userId: 'evoqsdl7@mailinator.com', evoqUserKey: 'USR-1', organization: 'TEAM-00076', application: 'crm', createdAt: now, expiresAt: now + 3600_000 };
  return serializeSession(s);
}
type Call = { method: string; body: any };

/** A tenant with 12 Contacts, 5 of them linked to sign-in users (the TEAM-00076 shape seen on 2 Nov). */
function mockTenant(): Call[] {
  const calls: Call[] = [];
  global.fetch = (async (url: string, init: any = {}) => {
    if (url.includes('internal_tenant_resolver.resolve')) {
      return new Response(JSON.stringify({ status: 'success', data: { user_id: 'evoqsdl7@mailinator.com', evoq_user_key: 'USR-1', organization: 'TEAM-00076', application: 'crm', backend_url: BACKEND, delegation_token: 't', delegation_token_expires_in: 300, cache_ttl_seconds: 60 } }), { status: 200 });
    }
    const method = new URL(url).pathname.replace('/api/method/', '');
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    calls.push({ method, body });
    const customersOnly = JSON.stringify(body?.filters ?? []).includes('"user","is","not set"');
    if (method === 'frappe.desk.reportview.get_count') {
      if (body.doctype === 'Contact') return new Response(JSON.stringify({ message: customersOnly ? 7 : 12 }), { status: 200 });
      return new Response(JSON.stringify({ message: 0 }), { status: 200 });
    }
    if (method === 'frappe.client.get_list') return new Response(JSON.stringify({ message: [{ name: 'C-1' }] }), { status: 200 });
    if (method === 'frappe.client.get_single_value') return new Response(JSON.stringify({ message: '' }), { status: 200 });
    return new Response('{}', { status: 404 });
  }) as any;
  return calls;
}

function listReq(body: object): NextRequest {
  return new NextRequest('https://crm.evoq.app/api/datalist', {
    method: 'POST', body: JSON.stringify(body),
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie()}`, 'Content-Type': 'application/json' },
  });
}

describe('R68 the rule', () => {
  test('a Contact list leaves team members out by default', () => {
    const args = buildListArgs({ module: 'Contact', fields: ['name'], filters: [] });
    assert.deepStrictEqual(args.filters.at(-1), RULE);
    assert.deepStrictEqual([...CUSTOMER_CONTACTS_ONLY], RULE);
  });
  test('asking for team members lists everyone; only an explicit true does it', () => {
    assert.ok(!JSON.stringify(buildListArgs({ module: 'Contact', fields: ['name'], include_team_members: true }).filters).includes('not set'));
    for (const v of [false, 'true', 1, undefined] as any[]) {
      assert.deepStrictEqual(buildListArgs({ module: 'Contact', fields: ['name'], include_team_members: v }).filters.at(-1), RULE, String(v));
    }
  });
  test('other doctypes are untouched', () => {
    for (const m of ['CRM Lead', 'CRM Deal', 'CRM Organization']) {
      assert.deepStrictEqual(buildListArgs({ module: m, fields: ['name'], filters: [] }).filters, [], m);
    }
  });
  test('a customer whose email matches a member is still listed: the rule never looks at email', () => {
    assert.ok(!JSON.stringify(buildListArgs({ module: 'Contact', fields: ['name'] }).filters).includes('email'));
  });
  test("the user's own filters still apply alongside the rule", () => {
    const args = buildListArgs({ module: 'Contact', fields: ['name'], filters: [{ field: 'first_name', operator: 'contains', value: 'Ann' }] as any });
    assert.ok(args.filters.length >= 1);
    assert.deepStrictEqual(args.filters.at(-1), RULE);
  });
});

describe('R68 BFF', () => {
  beforeEach(() => { process.env.INTERNAL_SERVICE_SECRET = 's'; invalidateTenantCache(); });
  afterEach(() => { global.fetch = origFetch; delete process.env.INTERNAL_SERVICE_SECRET; });

  test('the Contact list and its total exclude team members', async () => {
    const calls = mockTenant();
    const res = await datalist(listReq({ module: 'Contact', fields: ['name'], filters: [] }));
    const out = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(out.total_count, 7);
    for (const m of ['frappe.client.get_list', 'frappe.desk.reportview.get_count']) {
      const c = calls.find((x) => x.method === m)!;
      assert.deepStrictEqual(c.body.filters.at(-1), RULE, m);
    }
  });
  test('"Show team members" lists all 12', async () => {
    mockTenant();
    const out = await (await datalist(listReq({ module: 'Contact', fields: ['name'], include_team_members: true }))).json();
    assert.strictEqual(out.total_count, 12);
  });
  test('the dashboard counts customer contacts only', async () => {
    const calls = mockTenant();
    const res = await metrics(new NextRequest('https://crm.evoq.app/api/dashboard/metrics', { headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie()}` } }));
    const out = await res.json();
    assert.deepStrictEqual(out.metrics.contacts, { status: "ok", value: 7 });
    const c = calls.find((x) => x.method === 'frappe.desk.reportview.get_count' && x.body.doctype === 'Contact')!;
    assert.deepStrictEqual(c.body.filters, [RULE]);
  });
  test('without a session nothing reaches the tenant', async () => {
    const calls = mockTenant();
    const res = await datalist(new NextRequest('https://crm.evoq.app/api/datalist', { method: 'POST', body: JSON.stringify({ module: 'Contact', fields: ['name'] }) }));
    assert.strictEqual(res.status, 401);
    assert.strictEqual(calls.length, 0);
  });
});

describe('R68 screen', () => {
  test('the Contacts page offers a "Show team members" switch that reloads the list', () => {
    const s = readFileSync(join(ROOT, 'src/components/Contact/ContactListing.tsx'), 'utf8');
    assert.match(s, /label="Show team members"/);
    assert.match(s, /include_team_members: showTeamMembers/);
    assert.match(s, /setRefreshKey/);
  });
});
