/**
 * newdocs/80 — CRM inside EVOQ CTRL (embedded mode) and EM-6 page-organization binding.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { middleware, config } from '../src/middleware';
import { GET as embedSignin } from '../src/app/embed/signin-required/route';
import { GET as sessionEnded } from '../src/app/api/auth/session-ended/route';
import { GET as proxyGET } from '../src/app/api/proxy/[...path]/route';
import { logoutPage } from '../src/lib/logout-page';
import { BffError, assertPageOrganization } from '../src/lib/tenant-fetch';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';

const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const SESSION: CrmSession = {
  userId: 'evoqsdl7@mailinator.com', evoqUserKey: 'USR-1', organization: 'TEAM-00076',
  application: 'crm', createdAt: Date.now(), expiresAt: Date.now() + 3600_000,
};

function req(path: string, { frame = false, cookie, headers = {} }: { frame?: boolean; cookie?: string; headers?: Record<string, string> } = {}) {
  const h: Record<string, string> = { ...headers, 'sec-fetch-dest': frame ? 'iframe' : 'document' };
  if (cookie) h.Cookie = `${SESSION_COOKIE_NAME}=${cookie}`;
  return new NextRequest(`https://crm.evoq.app${path}`, { headers: h });
}

describe('standalone crm.evoq.app is unchanged', () => {
  test('a top-level visit without a session still goes to the Evoq One sign-in', () => {
    const res = middleware(req('/leads'));
    assert.strictEqual(res.status, 307);
    assert.strictEqual(res.headers.get('location'), 'https://one.evoq.app/products/crm?signin=required&next=%2Fleads');
  });

  test('the embed page opened at the top level is the same sign-in redirect', async () => {
    const res = await embedSignin(req('/embed/signin-required?next=/deals'));
    assert.strictEqual(res.status, 307);
    assert.strictEqual(res.headers.get('location'), 'https://one.evoq.app/products/crm?signin=required&next=%2Fdeals');
  });

  test('session-ended at the top level still goes to Evoq One', async () => {
    const res = await sessionEnded(req('/api/auth/session-ended?next=/leads'));
    assert.strictEqual(res.headers.get('location'), 'https://one.evoq.app/products/crm?signin=required&next=%2Fleads');
  });

  test('a logout page at the top level still leaves for Evoq One', () => {
    const { html } = logoutPage('signed_out', {
      destination: 'https://one.evoq.app/products/crm', fallback: 'https://ctrl.evoq.app/api/auth/logout?continue=one',
      clearCtrl: 'https://ctrl.evoq.app/api/auth/logout?continue=none', clearOne: 'https://one.evoq.app/logout?mode=fetch',
    });
    assert.match(html, /window\.location\.replace\(ok\[0\] && ok\[1\] \? dest : fallback\)/);
  });
});

describe('inside CTRL (a frame request)', () => {
  test('no session → the embed page, never Evoq One (which refuses frames)', () => {
    const res = middleware(req('/leads/detail/L-1', { frame: true }));
    assert.strictEqual(res.status, 307);
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/embed/signin-required?next=%2Fleads%2Fdetail%2FL-1');
  });

  test('an unsafe path is not carried', () => {
    const res = middleware(req('/billing', { frame: true }));
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/embed/signin-required');
  });

  test('the embed page is outside the middleware and tells CTRL only', async () => {
    const matcher = new RegExp(`^${config.matcher[0].replace('/((?!', '/(?!(?:').replace(').*)', ')).*')}$`);
    assert.ok(!matcher.test('/embed/signin-required'));
    const res = await embedSignin(req('/embed/signin-required?next=/deals', { frame: true }));
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /window\.parent\.postMessage\(\{"evoq":1,"type":"signin-required","path":"\/deals"\}, "https:\/\/ctrl\.evoq\.app"\)/);
    assert.doesNotMatch(html, /postMessage\([^)]*"\*"\)/);
    assert.match(res.headers.get('content-security-policy') || '', /^default-src 'none'; script-src 'nonce-[^']+'; frame-ancestors 'self' https:\/\/ctrl\.evoq\.app$/);
  });

  test('session-ended in a frame goes to the embed page and still clears the session', async () => {
    const res = await sessionEnded(req('/api/auth/session-ended?next=/leads', { frame: true }));
    assert.strictEqual(res.headers.get('location'), 'https://crm.evoq.app/embed/signin-required?next=%2Fleads');
    assert.match(res.headers.get('set-cookie') || '', new RegExp(`${SESSION_COOKIE_NAME}=;`));
  });

  test('the logout page may be framed by CTRL only, and tells CTRL instead of leaving', () => {
    const { html, csp } = logoutPage('signed_out', {
      destination: 'https://one.evoq.app/products/crm', fallback: 'https://ctrl.evoq.app/api/auth/logout?continue=one',
      clearCtrl: 'https://ctrl.evoq.app/api/auth/logout?continue=none', clearOne: 'https://one.evoq.app/logout?mode=fetch',
    });
    assert.match(csp, /frame-ancestors 'self' https:\/\/ctrl\.evoq\.app/);
    assert.match(html, /if \(framed\) \{ window\.parent\.postMessage\(\{ evoq: 1, type: 'signed-out' \}, ctrl\); return; \}/);
  });

  test('embedded mode hides only CRM’s bar and footer, marked by the browser before paint', () => {
    const css = read('src/app/globals.css');
    assert.match(css, /html\[data-evoq-embedded\] \.ts-vertical-layout-header,\s*html\[data-evoq-embedded\] \.ts-vertical-layout-footer \{\s*display: none !important;/);
    assert.match(read('src/lib/embed-client.ts'), /window\.self!==window\.top\)document\.documentElement\.setAttribute\('data-evoq-embedded','1'\)/);
    assert.match(read('src/app/RootLayout.tsx'), /<script dangerouslySetInnerHTML=\{\{ __html: EMBED_MARK_SCRIPT \}\} \/>/);
    assert.match(read('src/app/RootLayout.tsx'), /<EmbedBridge \/>/);
  });

  test('messages go to the CTRL origin only; other sites open in a new tab', () => {
    const client = read('src/lib/embed-client.ts');
    assert.match(client, /window\.parent\.postMessage\(message, ctrlOrigin\(\)\)/);
    const bridge = read('src/components/EmbedBridge.tsx');
    assert.match(bridge, /url\.origin === ctrl && url\.pathname\.startsWith\('\/launch\/'\)\) tellCtrl\(\{ evoq: 1, type: 'choose-organization' \}\)/);
    assert.match(bridge, /window\.open\(url\.toString\(\), '_blank', 'noopener,noreferrer'\)/);
  });
});

describe('EM-6: each page is bound to its organization', () => {
  const base = new Request('https://crm.evoq.app/api/create');
  const withOrg = (org: string) => new Request('https://crm.evoq.app/api/create', { headers: { 'x-evoq-page-org': org } });

  test('a page of the session’s organization, or no header (old pages, server calls), passes', () => {
    assert.doesNotThrow(() => assertPageOrganization(base, SESSION));
    assert.doesNotThrow(() => assertPageOrganization(withOrg('TEAM-00076'), SESSION));
  });

  test('a page drawn for another organization is refused with 409 ORGANIZATION_CHANGED', () => {
    assert.throws(
      () => assertPageOrganization(withOrg('TEAM-00069'), SESSION),
      (err: unknown) => err instanceof BffError && err.status === 409 && err.code === 'ORGANIZATION_CHANGED',
    );
  });

  test('tenantFetch checks it before asking Central or the tenant', () => {
    const src = read('src/lib/tenant-fetch.ts');
    const i = src.indexOf('assertPageOrganization(req, session);');
    assert.ok(i > 0 && i < src.indexOf('resolution = await resolveTenant('));
  });

  test('the raw proxy refuses it too, and never forwards the header', async () => {
    const r = new NextRequest('https://crm.evoq.app/api/proxy/api/method/ping', {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${serializeSession(SESSION)}`, 'x-evoq-page-org': 'TEAM-00069' },
    });
    const res = await proxyGET(r, { params: { path: ['api', 'method', 'ping'] } });
    assert.strictEqual(res.status, 409);
    assert.strictEqual((await res.json()).error, 'ORGANIZATION_CHANGED');
    assert.match(read('src/app/api/proxy/[...path]/route.ts'), /'cookie',\n  PAGE_ORG_HEADER,\n\]\);/);
  });

  test('the browser adds the header to CRM’s own BFF calls only (fetch and XHR), not to /api/auth or other sites', () => {
    const client = read('src/lib/embed-client.ts');
    assert.match(client, /u\.origin === window\.location\.origin && u\.pathname\.startsWith\('\/api\/'\) && !u\.pathname\.startsWith\('\/api\/auth\/'\)/);
    assert.match(client, /headers\.set\(PAGE_ORG_HEADER, pageOrganization\)/);
    assert.match(client, /this\.setRequestHeader\(PAGE_ORG_HEADER, pageOrganization\)/);
    assert.match(read('src/components/CrmShell.tsx'), /<PageOrganization value=\{info\?\.organization \?\? null\} \/>/);
  });
});
