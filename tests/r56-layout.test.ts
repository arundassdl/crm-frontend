/**
 * R56 — CRM application shell on every authenticated route (doc 60).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { GET as logout } from '../src/app/api/auth/logout/route';
import { orgHomeHref } from '../src/components/CrmSessionContext';

const APP = join(__dirname, '..', 'src', 'app');

function layouts(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...layouts(p));
    else if (e === 'layout.tsx') out.push(p);
  }
  return out;
}

describe('R56 shared CRM shell', () => {
  test('org dashboard layout renders inside CrmShell (root cause of R56)', () => {
    const src = readFileSync(join(APP, 'org', '[orgid]', 'layout.tsx'), 'utf8');
    assert.match(src, /<CrmShell>/);
    assert.match(src, /Organization Access Denied/, 'cross-org guard must stay');
  });

  test('every CRM module layout uses CrmShell, none copies the shell', () => {
    for (const mod of ['(dashboard)', 'leads', 'deals', 'contacts', 'accounts', 'tasks', 'user', 'roles']) {
      const src = readFileSync(join(APP, mod, 'layout.tsx'), 'utf8');
      assert.match(src, /CrmShell/, `${mod} layout must use CrmShell`);
    }
    for (const f of layouts(APP)) {
      const src = readFileSync(f, 'utf8');
      assert.ok(!/VerticalLayout navigation=/.test(src), `${f} must not copy the shell`);
    }
  });

  test('sidebar Dashboard and logo link to the session organization, not a hardcoded team', () => {
    assert.strictEqual(orgHomeHref({ organization: 'TEAM-00076', userId: 'a@b' }), '/org/TEAM-00076');
    assert.strictEqual(orgHomeHref({ organization: 'TEAM-00069', userId: 'a@b' }), '/org/TEAM-00069');
    assert.strictEqual(orgHomeHref(null), '/');
    const menu = readFileSync(join(APP, '..', 'components', 'layout', 'vertical', 'VerticalMenu.tsx'), 'utf8');
    assert.match(menu, /href=\{orgHomeHref\(crmSession\)\}/);
    for (const f of ['components/CrmShell.tsx', 'components/layout/vertical/VerticalMenu.tsx', 'components/layout/vertical/NavbarContent.tsx', 'components/layout/shared/UserDropdown.tsx']) {
      assert.ok(!readFileSync(join(APP, '..', f), 'utf8').includes('TEAM-0'), `${f} must not hardcode an organization`);
    }
  });

  test('shell passes only organization and user id to the browser', () => {
    const src = readFileSync(join(APP, '..', 'components', 'CrmShell.tsx'), 'utf8');
    assert.match(src, /\{ organization: session\.organization, userId: session\.userId \}/);
    assert.ok(!/evoqUserKey/.test(src));
  });
});

describe('R56 logout', () => {
  // R59: logout continues through CTRL (clears its cookie) to Evoq One; see r59-logout.test.ts.
  test('clears the CRM session cookie and continues through CTRL', async () => {
    const res = await logout(new NextRequest('https://crm.evoq.app/api/auth/logout'));
    assert.strictEqual(res.status, 303);
    assert.strictEqual(res.headers.get('location'), 'https://ctrl.evoq.app/api/auth/logout?continue=one');
    const h: any = res.headers;
    const cookies: string[] = h.getSetCookie ? h.getSetCookie() : [h.get('set-cookie') || ''];
    const session = cookies.find((c) => c.startsWith('evoq_crm_session='));
    assert.ok(session, 'session cookie must be cleared');
    assert.match(session!, /Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    assert.match(session!, /HttpOnly/i);
    assert.ok(cookies.some((c) => c.startsWith('isLoggedIn=')));
  });
});

describe('R56 mobile navigation', () => {
  test('small screens get a slide-over drawer opened by the header menu button', () => {
    const nav = readFileSync(join(APP, '..', 'components', 'layout', 'vertical', 'Navigation.tsx'), 'utf8');
    const bar = readFileSync(join(APP, '..', 'components', 'layout', 'vertical', 'NavbarContent.tsx'), 'utf8');
    assert.match(nav, /variant='temporary'/);
    assert.match(nav, /const openNav = \(\) => setMobileOpen\(true\)/, 'one tap must open, not toggle twice');
    assert.match(nav, /setMobileOpen\(false\)\s*\n\s*\}, \[pathname, isBreakpointReached\]\)/, 'drawer closes on navigation');
    assert.match(bar, /if \(isBreakpointReached\) \{ window\.dispatchEvent\(new Event\(MOBILE_NAV_TOGGLE_EVENT\)\)/);
  });
});

describe('R56 proxy response headers', () => {
  test('decoded body is not labelled gzip (ERR_CONTENT_DECODING_FAILED)', async () => {
    const { GET } = await import('../src/app/api/proxy/[...path]/route');
    const { NextRequest } = await import('next/server');
    const { serializeSession, SESSION_COOKIE_NAME } = await import('../src/lib/session');
    const { invalidateTenantCache } = await import('../src/lib/tenant-resolver');
    invalidateTenantCache();
    const orig = global.fetch;
    global.fetch = (async (url: string) => {
      if (url.includes('internal_tenant_resolver.resolve')) {
        return new Response(JSON.stringify({ status: 'success', data: { backend_url: 'https://crm.team-x.evoq.app', delegation_token: 't', evoq_user_key: 'k', cache_ttl_seconds: 60 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ message: { full_name: 'Evoq Owner' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', 'Content-Length': '999' },
      });
    }) as any;
    try {
      const cookie = serializeSession({ userId: 'a@b', evoqUserKey: 'k', organization: 'TEAM-X', application: 'crm', createdAt: Date.now(), expiresAt: Date.now() + 60000 });
      const req = new NextRequest('https://crm.evoq.app/api/proxy/api/method/frappe.client.get_value', { headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie}` } });
      const res = await GET(req, { params: { path: ['api', 'method', 'frappe.client.get_value'] } });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-encoding'), null);
      assert.notStrictEqual(res.headers.get('content-length'), '999');
      assert.strictEqual((await res.json()).message.full_name, 'Evoq Owner');
    } finally {
      global.fetch = orig;
    }
  });

  test('/org index page redirects to the session organization', () => {
    const src = readFileSync(join(APP, 'org', 'page.tsx'), 'utf8');
    assert.match(src, /redirect\(`\/org\/\$\{encodeURIComponent\(session\.organization\)\}`\)/);
  });
});
