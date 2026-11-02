/**
 * R57 — real dashboard metrics and EVOQ branding (doc 61).
 */
import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';
import { invalidateTenantCache } from '../src/lib/tenant-resolver';
import { formatMoney, summariseRevenue } from '../src/lib/dashboard-metrics';
import { GET as metrics } from '../src/app/api/dashboard/metrics/route';

const ROOT = join(__dirname, '..');
const origFetch = global.fetch;
const TOKEN = 'secret-rs256-delegation-jwt';
const BACKENDS: Record<string, string> = {
  'TEAM-00076': 'https://crm.team-00076.evoq.app',
  'TEAM-00069': 'https://crm.team-00069.evoq.app',
};

function cookie(org = 'TEAM-00076'): string {
  const s: CrmSession = {
    userId: 'evoqsdl7@mailinator.com',
    evoqUserKey: 'USR-6BE79B1638',
    organization: org,
    application: 'crm',
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600_000,
  };
  return serializeSession(s);
}

function req(query = '', session: string | null = cookie()): NextRequest {
  const headers: Record<string, string> = {};
  if (session) headers.Cookie = `${SESSION_COOKIE_NAME}=${session}`;
  return new NextRequest(`https://crm.evoq.app/api/dashboard/metrics${query}`, { method: 'GET', headers });
}

type Call = { host: string; method: string; body: any; headers: Headers };
type Backend = (host: string, method: string, body: any) => [number, any];

/** Per-tenant fake data, keyed by backend host. */
const DATA: Record<string, { counts: Record<string, number>; statuses: any[]; deals: any[]; currency: string }> = {
  'crm.team-00076.evoq.app': {
    counts: { Contact: 11, 'CRM Lead': 13, 'CRM Deal': 7 },
    statuses: [{ name: 'Won' }],
    deals: [{ name: 'CRM-DEAL-2026-00005', deal_value: 175000, currency: 'INR' }],
    currency: '',
  },
  'crm.team-00069.evoq.app': { counts: { Contact: 0, 'CRM Lead': 2, 'CRM Deal': 0 }, statuses: [{ name: 'Won' }], deals: [], currency: '' },
};

const tenantBackend: Backend = (host, method, body) => {
  const d = DATA[host];
  if (method === 'frappe.desk.reportview.get_count') return [200, { message: d.counts[body.doctype] }];
  if (method === 'frappe.client.get_single_value') return [200, { message: d.currency }];
  if (method === 'frappe.client.get_list' && body.doctype === 'CRM Deal Status') return [200, { message: d.statuses }];
  if (method === 'frappe.client.get_list' && body.doctype === 'CRM Deal') {
    const won = new Set(body.filters[0][3]);
    return [200, { message: d.deals.filter((x) => won.has('Won')).slice(body.limit_start, body.limit_start + body.limit_page_length) }];
  }
  return [404, {}];
};

function mockFetch(backend: Backend = tenantBackend): Call[] {
  const calls: Call[] = [];
  global.fetch = (async (url: string, init: any = {}) => {
    if (url.includes('internal_tenant_resolver.resolve')) {
      const b = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            user_id: b.user_id,
            evoq_user_key: 'USR-6BE79B1638',
            organization: b.organization,
            application: 'crm',
            backend_url: BACKENDS[b.organization],
            delegation_token: TOKEN,
            delegation_token_expires_in: 300,
            cache_ttl_seconds: 60,
          },
        }),
        { status: 200 },
      );
    }
    const u = new URL(url);
    const body = init.body && typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    const method = u.pathname.replace('/api/method/', '');
    calls.push({ host: u.host, method, body, headers: new Headers(init.headers) });
    const [status, json] = backend(u.host, method, body);
    return new Response(JSON.stringify(json), { status });
  }) as any;
  return calls;
}

describe('R57 Booked Revenue summary', () => {
  test('sums won deals, de-duplicates by name, skips missing amounts', () => {
    const r = summariseRevenue(
      [
        { name: 'D1', deal_value: 175000, currency: 'INR' },
        { name: 'D1', deal_value: 175000, currency: 'INR' },
        { name: 'D2', deal_value: 25000.5, currency: 'INR' },
        { name: 'D3', deal_value: null, currency: 'INR' },
      ],
      null,
    );
    assert.strictEqual(r.amount, 200000.5);
    assert.strictEqual(r.currency, 'INR');
    assert.strictEqual(r.deal_count, 2);
    assert.strictEqual(r.deals_without_amount, 1);
    assert.deepStrictEqual(r.other_currencies, []);
  });

  test('zero with no qualifying deals; no currency invented', () => {
    const r = summariseRevenue([], null);
    assert.strictEqual(r.amount, 0);
    assert.strictEqual(r.currency, null);
    assert.strictEqual(r.deal_count, 0);
    assert.strictEqual(formatMoney(r.amount, r.currency), '0');
  });

  test('configured currency is the headline; other currencies are listed, not converted or added', () => {
    const r = summariseRevenue(
      [
        { name: 'A', deal_value: 1000, currency: 'USD' },
        { name: 'B', deal_value: 50000, currency: 'INR' },
        { name: 'C', deal_value: 2000, currency: 'USD' },
      ],
      'INR',
    );
    assert.strictEqual(r.currency, 'INR');
    assert.strictEqual(r.amount, 50000);
    assert.deepStrictEqual(r.other_currencies, [{ currency: 'USD', amount: 3000, deal_count: 2 }]);
  });

  test('configured currency with no deals in it shows zero in that currency', () => {
    const r = summariseRevenue([{ name: 'A', deal_value: 10, currency: 'USD' }], 'INR');
    assert.strictEqual(r.currency, 'INR');
    assert.strictEqual(r.amount, 0);
    assert.strictEqual(r.other_currencies.length, 1);
  });

  test('formats INR with Indian grouping', () => {
    assert.strictEqual(formatMoney(175000, 'INR'), '₹1,75,000');
    assert.strictEqual(formatMoney(1234.5, 'USD'), '$1,234.50');
  });
});

describe('R57 /api/dashboard/metrics', () => {
  beforeEach(() => invalidateTenantCache());
  afterEach(() => {
    global.fetch = origFetch;
  });

  test('returns real counts and won-deal revenue for the session organization', async () => {
    const calls = mockFetch();
    const res = await metrics(req('?org=TEAM-00076'));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
    const body = await res.json();
    assert.strictEqual(body.organization, 'TEAM-00076');
    assert.deepStrictEqual(body.metrics.contacts, { status: 'ok', value: 11 });
    assert.deepStrictEqual(body.metrics.leads, { status: 'ok', value: 13 });
    assert.deepStrictEqual(body.metrics.deals, { status: 'ok', value: 7 });
    assert.strictEqual(body.metrics.revenue.amount, 175000);
    assert.strictEqual(body.metrics.revenue.currency, 'INR');
    assert.strictEqual(body.metrics.revenue.deal_count, 1);
    // Every tenant call went to TEAM-00076's backend as the delegated user.
    assert.ok(calls.length >= 5);
    for (const c of calls) {
      assert.strictEqual(c.host, 'crm.team-00076.evoq.app');
      assert.strictEqual(c.headers.get('x-evoq-delegation-token'), TOKEN);
      assert.strictEqual(c.headers.get('x-evoq-user-key'), 'USR-6BE79B1638');
    }
    // Won deals are selected by CRM Deal Status type, not hard-coded names.
    const st = calls.find((c) => c.body?.doctype === 'CRM Deal Status');
    assert.deepStrictEqual(st!.body.filters, [['CRM Deal Status', 'type', '=', 'Won']]);
    // The token never reaches the browser.
    assert.ok(!JSON.stringify(body).includes(TOKEN));
  });

  test('another organization gets its own figures (isolation) and zero revenue with no won deals', async () => {
    const calls = mockFetch();
    const body = await (await metrics(req('', cookie('TEAM-00069')))).json();
    assert.strictEqual(body.organization, 'TEAM-00069');
    assert.strictEqual(body.metrics.contacts.value, 0);
    assert.strictEqual(body.metrics.leads.value, 2);
    assert.strictEqual(body.metrics.revenue.amount, 0);
    assert.ok(calls.every((c) => c.host === 'crm.team-00069.evoq.app'));
  });

  test('an org query that does not match the session is refused before any tenant call', async () => {
    const calls = mockFetch();
    const res = await metrics(req('?org=TEAM-00069'));
    assert.strictEqual(res.status, 403);
    assert.strictEqual((await res.json()).error, 'ORGANIZATION_FORBIDDEN');
    assert.strictEqual(calls.length, 0);
  });

  test('no session → 401, no tenant call', async () => {
    const calls = mockFetch();
    const res = await metrics(req('', null));
    assert.strictEqual(res.status, 401);
    assert.strictEqual(calls.length, 0);
  });

  test('a failed figure is reported as an error, never a substitute number', async () => {
    mockFetch((host, method, body) => {
      if (method === 'frappe.desk.reportview.get_count' && body.doctype === 'Contact') return [403, { exc_type: 'PermissionError' }];
      if (method === 'frappe.client.get_list' && body.doctype === 'CRM Deal') return [500, {}];
      return tenantBackend(host, method, body);
    });
    const body = await (await metrics(req())).json();
    assert.deepStrictEqual(body.metrics.contacts, { status: 'error', kind: 'permission' });
    assert.deepStrictEqual(body.metrics.revenue, { status: 'error', kind: 'unavailable' });
    assert.strictEqual(body.metrics.leads.value, 13);
  });

  test('backend rejects the session for everything → 401 for the page', async () => {
    mockFetch(() => [401, {}]);
    const res = await metrics(req());
    assert.strictEqual(res.status, 401);
    assert.strictEqual((await res.json()).kind, 'auth');
  });

  test('older CRM without status type falls back to the status named Won', async () => {
    const calls = mockFetch((host, method, body) => {
      if (body?.doctype === 'CRM Deal Status') return [417, { exception: 'frappe.exceptions.DataError: Field not permitted in query: type' }];
      return tenantBackend(host, method, body);
    });
    const body = await (await metrics(req())).json();
    assert.strictEqual(body.metrics.revenue.won_rule, 'status_name');
    assert.strictEqual(body.metrics.revenue.amount, 175000);
    const dealCall = calls.find((c) => c.method === 'frappe.client.get_list' && c.body?.doctype === 'CRM Deal');
    assert.deepStrictEqual(dealCall!.body.filters, [['CRM Deal', 'status', 'in', ['Won']]]);
  });
});

describe('R57 dashboard UI and branding (source checks)', () => {
  const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

  test('dashboard has no hard-coded sample figures and reads the metrics API', () => {
    const src = read('src/components/Dashboard/DashboardPage.tsx');
    for (const fake of ['15,432', '12,983', '1,283', '234.8']) assert.ok(!src.includes(fake), `sample figure ${fake} still present`);
    assert.match(src, /\/api\/dashboard\/metrics/);
    assert.ok(!/TEAM-\d+/.test(src), 'no hard-coded organization');
  });

  test('brand is EVOQ CRM; no Social DNA Labs in visible config, logo or footer', () => {
    const cfg = read('src/configs/themeConfig.ts');
    assert.match(cfg, /templateName: 'EVOQ CRM'/);
    assert.match(cfg, /footerText: 'EVOQ'/);
    for (const p of ['src/configs/themeConfig.ts', 'src/components/layout/shared/Logo.tsx', 'src/components/layout/vertical/FooterContent.tsx']) {
      assert.ok(!/social\s*dna/i.test(read(p)), `${p} still mentions Social DNA`);
    }
    const logo = read('src/components/layout/shared/Logo.tsx');
    assert.match(logo, /\/images\/logo\/logo-evoq\.png/);
    assert.ok(!logo.includes('SDLLogo'));
  });

  test('page metadata points at the EVOQ favicon', () => {
    const layout = read('src/app/layout.tsx');
    assert.match(layout, /favicon\.ico/);
    assert.match(layout, /evoq-mark\.png/);
  });
});
