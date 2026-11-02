/**
 * R55 — CRM module data through the BFF (doc 59).
 * The grid/detail/CRUD routes must reach the tenant through the delegated session,
 * use standard Frappe APIs, and report errors by kind instead of returning empty lists.
 */
import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';
import { invalidateTenantCache } from '../src/lib/tenant-resolver';
import { buildListArgs, normaliseOrderBy, translateFilters, ListRequestError } from '../src/lib/frappe-list';
import { cleanDocForSave, fillPlaceholders } from '../src/lib/frappe-doc';
import { backendError, frappeErrorMessage } from '../src/lib/tenant-fetch';
import { describeListError } from '../src/services/api/common-erpnext-api/listing-api-get';
import { POST as datalist } from '../src/app/api/datalist/route';
import { POST as detailData } from '../src/app/api/detail-data/route';
import { POST as createMulti } from '../src/app/api/create-multiple-doc/route';
import { POST as deleteDoc } from '../src/app/api/delete-doc/route';
import { POST as searchLink } from '../src/app/api/search-link/route';
import { POST as docsCreate } from '../src/app/api/docs/create/route';

const origFetch = global.fetch;
const TOKEN = 'secret-rs256-delegation-jwt';
const BACKEND = 'https://crm.team-00076.evoq.app';

function cookie(org = 'TEAM-00076', expiresAt = Date.now() + 3600_000): string {
  const s: CrmSession = {
    userId: 'evoqsdl7@mailinator.com',
    evoqUserKey: 'USR-6BE79B1638',
    organization: org,
    application: 'crm',
    createdAt: Date.now(),
    expiresAt,
  };
  return serializeSession(s);
}

function req(path: string, body: unknown, withSession: string | null = cookie()): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withSession) headers.Cookie = `${SESSION_COOKIE_NAME}=${withSession}`;
  return new NextRequest(`https://crm.evoq.app${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

type Call = { url: string; method: string; headers: Headers; body: any };

/** Mock Central resolver + tenant backend. `backend` returns [status, json] for a method name. */
function mockFetch(backend: (method: string, body: any) => [number, any], orgBackend = BACKEND): Call[] {
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
            backend_url: orgBackend,
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
    calls.push({ url, method: init.method, headers: new Headers(init.headers), body });
    const method = u.pathname.replace('/api/method/', '');
    const [status, json] = backend(method, body);
    return new Response(JSON.stringify(json), { status });
  }) as any;
  return calls;
}

describe('R55 list translation (frappe-list)', () => {
  test('keeps main-doctype fields, adds name, drops related-doctype and unsafe fields', () => {
    const a = buildListArgs({
      module: 'CRM Lead',
      fields: [
        { doctype: 'CRM Lead', field: 'lead_name' },
        { doctype: 'Contact', field: 'email_id' },
        { doctype: 'CRM Lead', field: 'status; drop table' },
        { doctype: 'CRM Lead', field: 'lead_name' },
      ],
      filters: [],
      limit_start: 40,
      limit_page_length: 20,
      order_by: 'CRM Lead.modified desc',
    });
    assert.deepStrictEqual(a.fields, ['name', 'lead_name']);
    assert.strictEqual(a.order_by, 'modified desc');
    assert.strictEqual(a.limit_start, 40);
    assert.strictEqual(a.limit_page_length, 20);
  });

  test('quick search becomes or_filters on the main doctype; plain filters are qualified', () => {
    const r = translateFilters(
      [
        ['OR', ['tabCRM Lead.lead_name', 'like', '%acme%'], ['tabCRM Lead.email', 'like', '%acme%'], ['tabContact.x', 'like', '%a%']],
        ['status', '=', 'New'],
        ['Dynamic Link', 'link_doctype', '=', 'CRM Organization'],
        ['status', 'DROP', 'x'],
      ],
      'CRM Lead',
    );
    assert.deepStrictEqual(r.or_filters, [
      ['CRM Lead', 'lead_name', 'like', '%acme%'],
      ['CRM Lead', 'email', 'like', '%acme%'],
    ]);
    assert.deepStrictEqual(r.filters, [
      ['CRM Lead', 'status', '=', 'New'],
      ['Dynamic Link', 'link_doctype', '=', 'CRM Organization'],
    ]);
  });

  test('order_by rejects injection and unknown fields', () => {
    const allowed = new Set(['name', 'lead_name']);
    assert.strictEqual(normaliseOrderBy('lead_name asc', 'CRM Lead', allowed), 'lead_name asc');
    assert.strictEqual(normaliseOrderBy('lead_name; select 1', 'CRM Lead', allowed), 'modified desc');
    assert.strictEqual(normaliseOrderBy('secret_field asc', 'CRM Lead', allowed), 'modified desc');
  });

  test('page size is clamped and bad doctype is rejected', () => {
    assert.strictEqual(buildListArgs({ module: 'Contact', fields: [], limit_page_length: 100000 }).limit_page_length, 500);
    assert.throws(() => buildListArgs({ module: 'Contact`; --', fields: [] }), ListRequestError);
    assert.throws(() => buildListArgs({ module: 'Contact' } as any), ListRequestError);
  });
});

describe('R55 document helpers (frappe-doc)', () => {
  test('cleanDocForSave drops server-owned keys and child-row doctype', () => {
    const out = cleanDocForSave({
      owner: 'attacker@x',
      __unsaved: 1,
      deal_name: 'D',
      contacts: [{ doctype: 'CRM Contact', __islocal: 1, name: 'new-1', parenttype: 'CRM Deal', contact: 'C-1' }],
    });
    assert.deepStrictEqual(out, { deal_name: 'D', contacts: [{ contact: 'C-1' }] });
  });

  test('fillPlaceholders resolves {{key.field}} deeply', () => {
    const out = fillPlaceholders({ a: '{{lead.name}}', b: [{ c: 'x {{lead.name}} y' }] }, { lead: { name: 'CRM-LEAD-1' } });
    assert.deepStrictEqual(out, { a: 'CRM-LEAD-1', b: [{ c: 'x CRM-LEAD-1 y' }] });
  });
});

describe('R55 error mapping', () => {
  test('Frappe statuses map to UI error kinds', () => {
    assert.strictEqual(backendError(401, {}).kind, 'auth');
    assert.strictEqual(backendError(403, {}).kind, 'permission');
    assert.strictEqual(backendError(417, { exc_type: 'PermissionError' }).kind, 'permission');
    assert.strictEqual(backendError(404, {}).kind, 'not_found');
    assert.strictEqual(backendError(417, {}).kind, 'validation');
    assert.strictEqual(backendError(500, {}).kind, 'unavailable');
    assert.strictEqual(backendError(500, {}).status, 502);
  });

  test('server messages are extracted and stripped of HTML', () => {
    const p = { _server_messages: JSON.stringify([JSON.stringify({ message: '<b>Email</b> is required' })]) };
    assert.strictEqual(frappeErrorMessage(p), 'Email is required');
  });

  test('client describeListError distinguishes session, permission and outage', () => {
    assert.strictEqual(describeListError({ response: { status: 401, data: {} } }).kind, 'auth');
    assert.strictEqual(describeListError({ response: { status: 403, data: { kind: 'permission', message: 'No' } } }).message, 'No');
    assert.strictEqual(describeListError(new Error('Network Error')).kind, 'unavailable');
  });
});

describe('R55 /api/datalist through delegated session', () => {
  beforeEach(() => invalidateTenantCache());
  afterEach(() => {
    global.fetch = origFetch;
  });

  test('no session → 401 auth (not an empty list)', async () => {
    mockFetch(() => [200, {}]);
    const res = await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [] }, null));
    assert.strictEqual(res.status, 401);
    assert.strictEqual((await res.json()).kind, 'auth');
  });

  test('expired session → 401', async () => {
    mockFetch(() => [200, {}]);
    const res = await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [] }, cookie('TEAM-00076', Date.now() - 1000)));
    assert.strictEqual(res.status, 401);
  });

  test('valid session → get_list + get_count on the resolved tenant with delegation headers', async () => {
    const calls = mockFetch((m) =>
      m === 'frappe.client.get_list'
        ? [200, { message: [{ name: 'CRM-LEAD-0001', lead_name: 'Acme' }] }]
        : [200, { message: 7 }],
    );
    const res = await datalist(
      req('/api/datalist', {
        module: 'CRM Lead',
        fields: [{ doctype: 'CRM Lead', field: 'lead_name' }],
        filters: [['OR', ['tabCRM Lead.lead_name', 'like', '%ac%']]],
        limit_start: 0,
        limit_page_length: 20,
      }),
    );
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(!text.includes(TOKEN), 'delegation token must not reach the browser');
    const data = JSON.parse(text);
    assert.deepStrictEqual(data.records, [{ id: 'CRM-LEAD-0001', name: 'CRM-LEAD-0001', lead_name: 'Acme' }]);
    assert.strictEqual(data.total_count, 7);

    assert.strictEqual(calls.length, 2);
    for (const c of calls) {
      assert.ok(c.url.startsWith(`${BACKEND}/api/method/`));
      assert.strictEqual(c.headers.get('x-evoq-delegation-token'), TOKEN);
      assert.strictEqual(c.headers.get('x-evoq-user-key'), 'USR-6BE79B1638');
      assert.strictEqual(c.headers.get('authorization'), null);
    }
    const listCall = calls.find((c) => c.url.endsWith('frappe.client.get_list'))!;
    assert.strictEqual(listCall.body.doctype, 'CRM Lead');
    assert.deepStrictEqual(listCall.body.or_filters, [['CRM Lead', 'lead_name', 'like', '%ac%']]);
    assert.ok(!calls.some((c) => c.url.includes('sdl_user_management')));
  });

  test('client Authorization / delegation headers are ignored', async () => {
    const calls = mockFetch((m) => (m === 'frappe.client.get_list' ? [200, { message: [] }] : [200, { message: 0 }]));
    const r = new NextRequest('https://crm.evoq.app/api/datalist', {
      method: 'POST',
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${cookie()}`,
        Authorization: 'token attacker:secret',
        'X-Evoq-Delegation-Token': 'forged',
      },
      body: JSON.stringify({ module: 'CRM Lead', fields: [] }),
    });
    await datalist(r);
    for (const c of calls) {
      assert.strictEqual(c.headers.get('x-evoq-delegation-token'), TOKEN);
      assert.strictEqual(c.headers.get('authorization'), null);
    }
  });

  test('backend 403 (no CRM role) → 403 permission', async () => {
    mockFetch(() => [403, { exc_type: 'PermissionError', _server_messages: JSON.stringify([JSON.stringify({ message: 'Not permitted' })]) }]);
    const res = await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [] }));
    assert.strictEqual(res.status, 403);
    const d = await res.json();
    assert.strictEqual(d.kind, 'permission');
    assert.strictEqual(d.message, 'Not permitted');
  });

  test('backend 401 (delegation rejected) → 401 auth', async () => {
    mockFetch(() => [401, {}]);
    const res = await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [] }));
    assert.strictEqual(res.status, 401);
    assert.strictEqual((await res.json()).kind, 'auth');
  });

  test('backend unreachable → 502 unavailable', async () => {
    global.fetch = (async (url: string, init: any) => {
      if (url.includes('internal_tenant_resolver.resolve')) {
        return new Response(
          JSON.stringify({ status: 'success', data: { backend_url: BACKEND, delegation_token: TOKEN, evoq_user_key: 'k', cache_ttl_seconds: 60 } }),
          { status: 200 },
        );
      }
      throw new Error('ECONNREFUSED');
    }) as any;
    const res = await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [] }));
    assert.strictEqual(res.status, 502);
    assert.strictEqual((await res.json()).kind, 'unavailable');
  });

  test('resolver refuses org (entitlement revoked) → 403 permission', async () => {
    global.fetch = (async () =>
      new Response(
        JSON.stringify({ status: 'error', error: { code: 'ENTITLEMENT_REVOKED', message: 'No CRM access', http_status: 403 } }),
        { status: 403 },
      )) as any;
    const res = await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [] }));
    assert.strictEqual(res.status, 403);
    const d = await res.json();
    assert.strictEqual(d.kind, 'permission');
    assert.strictEqual(d.error, 'ENTITLEMENT_REVOKED');
  });

  test('tenant is always the session organization (no client override)', async () => {
    let resolvedOrg = '';
    global.fetch = (async (url: string, init: any) => {
      if (url.includes('internal_tenant_resolver.resolve')) {
        resolvedOrg = JSON.parse(init.body).organization;
        return new Response(
          JSON.stringify({ status: 'success', data: { backend_url: BACKEND, delegation_token: TOKEN, evoq_user_key: 'k', cache_ttl_seconds: 60 } }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ message: [] }), { status: 200 });
    }) as any;
    await datalist(req('/api/datalist', { module: 'CRM Lead', fields: [], organization: 'TEAM-00069' }));
    assert.strictEqual(resolvedOrg, 'TEAM-00076');
  });
});

describe('R55 detail / create / delete / search routes', () => {
  beforeEach(() => invalidateTenantCache());
  afterEach(() => {
    global.fetch = origFetch;
  });

  test('detail-data returns { record } from frappe.client.get', async () => {
    mockFetch((m, b) => (m === 'frappe.client.get' ? [200, { message: { name: b.name, lead_name: 'Acme' } }] : [200, { message: [] }]));
    const res = await detailData(req('/api/detail-data', { doctype: 'CRM Lead', docname: 'CRM-LEAD-0001' }));
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { name: 'CRM-LEAD-0001', lead_name: 'Acme', record: { name: 'CRM-LEAD-0001', lead_name: 'Acme' } });
  });

  test('detail-data missing record → 404 not_found', async () => {
    mockFetch(() => [404, { exc_type: 'DoesNotExistError' }]);
    const res = await detailData(req('/api/detail-data', { doctype: 'CRM Lead', docname: 'nope' }));
    assert.strictEqual(res.status, 404);
  });

  test('create-multiple-doc inserts in order and fills placeholders', async () => {
    const calls = mockFetch((m, b) => {
      if (m === 'frappe.client.insert' && b.doc.doctype === 'CRM Lead') return [200, { message: { name: 'CRM-LEAD-0009' } }];
      if (m === 'frappe.client.insert') return [200, { message: { name: 'TASK-1', reference_docname: b.doc.reference_docname } }];
      return [500, {}];
    });
    const res = await createMulti(
      req('/api/create-multiple-doc', {
        documents: [
          { doctype: 'CRM Lead', key: 'lead', data: { first_name: 'R55', owner: 'spoof@x' } },
          { doctype: 'CRM Task', data: { title: 'T', reference_doctype: 'CRM Lead', reference_docname: '{{lead.name}}' } },
        ],
      }),
    );
    assert.strictEqual(res.status, 200);
    const d = await res.json();
    assert.strictEqual(d.success, true);
    assert.strictEqual(calls[0].body.doc.owner, undefined);
    assert.strictEqual(calls[1].body.doc.reference_docname, 'CRM-LEAD-0009');
  });

  test('create-multiple-doc validation error → 422 with Frappe message', async () => {
    mockFetch(() => [417, { _server_messages: JSON.stringify([JSON.stringify({ message: 'First Name is required' })]) }]);
    const res = await createMulti(req('/api/create-multiple-doc', { documents: [{ doctype: 'CRM Lead', data: {} }] }));
    assert.strictEqual(res.status, 422);
    assert.strictEqual((await res.json()).message, 'First Name is required');
  });

  test('delete-doc uses frappe.client.delete and reports permission errors', async () => {
    const calls = mockFetch(() => [403, {}]);
    const res = await deleteDoc(req('/api/delete-doc', { doctype: 'CRM Lead', name: 'CRM-LEAD-0001' }));
    assert.strictEqual(res.status, 403);
    assert.ok(calls[0].url.endsWith('/api/method/frappe.client.delete'));
  });

  test('search-link passes the typed text (not a blank) to search_link', async () => {
    const calls = mockFetch(() => [200, { message: [{ value: 'Acme' }] }]);
    const res = await searchLink(req('/api/search-link', { txt: 'Ac', module: 'CRM Organization' }));
    assert.deepStrictEqual(await res.json(), { data: [{ value: 'Acme' }] });
    assert.strictEqual(calls[0].body.txt, 'Ac');
    assert.strictEqual(calls[0].body.doctype, 'CRM Organization');
  });

  test('docs/create keeps the legacy { error: message } shape for the Deal form', async () => {
    mockFetch(() => [417, { _server_messages: JSON.stringify([JSON.stringify({ message: 'Organization is required' })]) }]);
    const res = await docsCreate(req('/api/docs/create', { module: 'CRM Deal', formData: { status: 'Qualification' } }));
    const d = await res.json();
    assert.strictEqual(d.success, false);
    assert.strictEqual(d.error, 'Organization is required');
  });
});

describe('R55 schema drift tolerance', () => {
  beforeEach(() => invalidateTenantCache());
  afterEach(() => {
    global.fetch = origFetch;
  });

  test('unknown column is dropped and the list still loads (Deals close_date)', async () => {
    const seen: string[][] = [];
    mockFetch((m, b) => {
      if (m === 'frappe.client.get_list') {
        seen.push(b.fields);
        if (b.fields.includes('close_date')) {
          return [417, { exc_type: 'ValidationError', exception: 'frappe.exceptions.ValidationError: Field not permitted in query: close_date' }];
        }
        return [200, { message: [{ name: 'CRM-DEAL-1', status: 'Qualification' }] }];
      }
      return [200, { message: 1 }];
    });
    const res = await datalist(
      req('/api/datalist', {
        module: 'CRM Deal',
        fields: [{ doctype: 'CRM Deal', field: 'status' }, { doctype: 'CRM Deal', field: 'close_date' }],
        order_by: 'close_date asc',
      }),
    );
    assert.strictEqual(res.status, 200);
    const d = await res.json();
    assert.strictEqual(d.records.length, 1);
    assert.deepStrictEqual(d.dropped_fields, ['close_date']);
    assert.deepStrictEqual(seen[seen.length - 1], ['name', 'status']);
  });

  test('a real validation error is not retried forever', async () => {
    let n = 0;
    mockFetch((m) => {
      if (m === 'frappe.client.get_list') n++;
      return [417, { exception: 'frappe.exceptions.ValidationError: Something else' }];
    });
    const res = await datalist(req('/api/datalist', { module: 'CRM Deal', fields: [] }));
    assert.strictEqual(res.status, 422);
    assert.strictEqual(n, 1);
  });

  test('detail-data accepts numeric CRM Task names', async () => {
    mockFetch((m, b) => [200, { message: { name: b.name, title: 'T' } }]);
    const res = await detailData(req('/api/detail-data', { doctype: 'CRM Task', docname: 3 }));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).record.name, '3');
  });
});

describe('R55 /api/related (notes, comments, tasks)', () => {
  beforeEach(() => invalidateTenantCache());
  afterEach(() => {
    global.fetch = origFetch;
  });

  test('notes come from FCRM Note with owner display name', async () => {
    const { POST: related } = await import('../src/app/api/related/route');
    const calls = mockFetch((m, b) => {
      if (m === 'frappe.client.get_list' && b.doctype === 'FCRM Note') {
        return [200, { message: [{ name: 'n1', content: '<p>hi</p>', owner: 'evoqsdl7@mailinator.com', creation: '2026-10-30' }] }];
      }
      if (m === 'frappe.client.get_list' && b.doctype === 'User') {
        return [200, { message: [{ name: 'evoqsdl7@mailinator.com', full_name: 'Evoq Owner', user_image: '/files/a.png' }] }];
      }
      if (m === 'frappe.client.get_count') return [200, { message: 1 }];
      return [500, {}];
    });
    const res = await related(req('/api/related', { kind: 'notes', doctype: 'CRM Deal', docname: 'CRM-DEAL-1' }));
    assert.strictEqual(res.status, 200);
    const d = await res.json();
    assert.strictEqual(d.total, 1);
    assert.strictEqual(d.data[0].owner_name, 'Evoq Owner');
    assert.strictEqual(d.data[0].email, 'evoqsdl7@mailinator.com');
    const listCall = calls.find((c) => c.body?.doctype === 'FCRM Note')!;
    assert.deepStrictEqual(listCall.body.filters, [
      ['FCRM Note', 'reference_doctype', '=', 'CRM Deal'],
      ['FCRM Note', 'reference_docname', '=', 'CRM-DEAL-1'],
    ]);
  });

  test('unknown kind is rejected', async () => {
    const { POST: related } = await import('../src/app/api/related/route');
    mockFetch(() => [200, {}]);
    const res = await related(req('/api/related', { kind: 'users', doctype: 'CRM Deal', docname: 'x' }));
    assert.strictEqual(res.status, 400);
  });
});
