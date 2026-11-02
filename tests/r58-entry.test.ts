/**
 * R58 — Evoq One as the CRM entry point (doc 62).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { middleware, config } from '../src/middleware';
import { getCtrlCrmLaunchUrl, getOneSigninUrl, safeCrmPath } from '../src/lib/one';
import { CrmSession, SESSION_COOKIE_NAME, serializeSession } from '../src/lib/session';

const ROOT = join(__dirname, '..');

function session(expiresAt = Date.now() + 3600_000): string {
  const s: CrmSession = {
    userId: 'evoqsdl7@mailinator.com', evoqUserKey: 'USR-1', organization: 'TEAM-00076',
    application: 'crm', createdAt: Date.now(), expiresAt,
  };
  return serializeSession(s);
}

function get(path: string, cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookie) headers.Cookie = `${SESSION_COOKIE_NAME}=${cookie}; isLoggedIn=true`;
  return new NextRequest(`https://crm.evoq.app${path}`, { headers });
}

describe('R58 unauthenticated CRM → Evoq One', () => {
  test('root goes to the Evoq One CRM page with sign-in offered', () => {
    const res = middleware(get('/'));
    assert.strictEqual(res.status, 307);
    assert.strictEqual(res.headers.get('location'), 'https://one.evoq.app/products/crm?signin=required');
  });

  test('a module or organization URL is kept as a relative next', () => {
    assert.strictEqual(middleware(get('/leads')).headers.get('location'), 'https://one.evoq.app/products/crm?signin=required&next=%2Fleads');
    assert.strictEqual(
      middleware(get('/org/TEAM-00076/')).headers.get('location'),
      'https://one.evoq.app/products/crm?signin=required&next=%2Forg%2FTEAM-00076%2F',
    );
  });

  test('legacy username/password pages are not reachable without a session', () => {
    for (const p of ['/login', '/register', '/forgot-password', '/update-password']) {
      const loc = middleware(get(p)).headers.get('location') || '';
      assert.ok(loc.startsWith('https://one.evoq.app/products/crm?signin=required'), `${p} → ${loc}`);
    }
  });

  test('expired or malformed session cookies are treated as signed out and cleared', () => {
    for (const bad of [session(Date.now() - 1000), 'garbage', 'a.b.c']) {
      const res = middleware(get('/deals', bad));
      assert.ok((res.headers.get('location') || '').startsWith('https://one.evoq.app/products/crm?signin=required'));
      assert.match(res.headers.get('set-cookie') || '', /evoq_crm_session=;/);
    }
  });

  test('a valid session passes; legacy login pages send it to its org', () => {
    assert.strictEqual(middleware(get('/leads', session())).headers.get('location'), null);
    assert.strictEqual(middleware(get('/login', session())).headers.get('location'), 'https://crm.evoq.app/org');
  });

  test('launch-ticket redemption (/api) is never intercepted', () => {
    const matcher = new RegExp(`^${config.matcher[0].replace('/((?!', '/(?!(?:').replace(').*)', ')).*')}$`);
    assert.ok(!matcher.test('/api/auth/launch'));
    assert.ok(matcher.test('/leads'));
  });

  test('only relative CRM paths survive; external targets are dropped', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', '/leads?x=1', '/admin', '/org/A/../b']) {
      assert.strictEqual(safeCrmPath(bad), null, bad);
    }
    assert.strictEqual(getOneSigninUrl('//evil.example'), 'https://one.evoq.app/products/crm?signin=required');
  });

  test('switch organization goes to the CTRL launch decision', () => {
    assert.strictEqual(getCtrlCrmLaunchUrl('TEAM-00069'), 'https://ctrl.evoq.app/launch/crm?org=TEAM-00069');
    assert.strictEqual(getCtrlCrmLaunchUrl(), 'https://ctrl.evoq.app/launch/crm/choose?reason=select');
    assert.strictEqual(getCtrlCrmLaunchUrl('../x'), 'https://ctrl.evoq.app/launch/crm/choose?reason=select');
  });

  test('org pages without a session go to Evoq One, not CTRL', () => {
    const layout = readFileSync(join(ROOT, 'src/app/org/[orgid]/layout.tsx'), 'utf8');
    assert.match(layout, /redirect\(getOneSigninUrl\(/);
    assert.match(layout, /Organization Access Denied/);
    assert.ok(!/getCtrlUrl/.test(layout));
  });
});
