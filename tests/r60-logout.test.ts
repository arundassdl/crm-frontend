/**
 * R60 — fast CRM logout to the Evoq One CRM page (doc 64).
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { GET as logoutGet, POST as logoutPost } from '../src/app/api/auth/logout/route';
import { POST as retryPost } from '../src/app/api/auth/logout/retry/route';
import { RETRY_COOKIE } from '../src/lib/logout-response';
import { CrmSession, SESSION_COOKIE_NAME, parseSession, serializeSession, signForPurpose, verifyForPurpose } from '../src/lib/session';
import { SIGN_OUT_TIMEOUT_MS } from '../src/lib/global-logout';

const ROOT = join(__dirname, '..');
const origFetch = global.fetch;
const USER = 'evoqsdl7@mailinator.com';

function cookie(user = USER): string {
  const now = Date.now();
  const s: CrmSession = { userId: user, evoqUserKey: 'USR-1', organization: 'TEAM-00076', application: 'crm', createdAt: now, expiresAt: now + 3600_000 };
  return serializeSession(s);
}
function post(path: string, cookies: Record<string, string>): NextRequest {
  const c = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  return new NextRequest(`https://crm.evoq.app${path}`, { method: 'POST', headers: c ? { Cookie: c } : {} });
}
function setCookies(res: Response): string[] {
  const h: any = res.headers;
  return h.getSetCookie ? h.getSetCookie() : [h.get('set-cookie') || ''];
}
function retryValue(res: Response): string | undefined {
  const c = setCookies(res).find((x) => x.startsWith(`${RETRY_COOKIE}=`) && !/Max-Age=0/i.test(x));
  return c?.split(';')[0].slice(RETRY_COOKIE.length + 1);
}
const calls: { url: string; body: any }[] = [];
function central(answer: () => Response) {
  calls.length = 0;
  global.fetch = (async (url: string, init: any = {}) => {
    calls.push({ url, body: init.body ? JSON.parse(init.body) : null });
    return answer();
  }) as any;
}
const ok = () => new Response(JSON.stringify({ message: { status: 'success', provider_outcome: 'queued' } }), { status: 200 });

describe('R60 logout page', () => {
  beforeEach(() => { process.env.INTERNAL_SERVICE_SECRET = 's'; });
  afterEach(() => { global.fetch = origFetch; delete process.env.INTERNAL_SERVICE_SECRET; });

  test('signed out: one Central call, then a page that clears CTRL + Evoq One in parallel and goes to the CRM product page', async () => {
    central(ok);
    const res = await logoutPost(post('/api/auth/logout', { [SESSION_COOKIE_NAME]: cookie() }));
    assert.strictEqual(calls.length, 1, 'exactly one Central call');
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /data-state="signed_out"/);
    assert.match(html, /"https:\/\/one\.evoq\.app\/products\/crm"/, 'destination is the Evoq One CRM page');
    assert.match(html, /"https:\/\/ctrl\.evoq\.app\/api\/auth\/logout\?continue=none"/);
    assert.match(html, /"https:\/\/one\.evoq\.app\/logout\?mode=fetch"/);
    assert.match(html, /Promise\.all\(\[clear\(/, 'the two clears run in parallel');
    assert.match(html, /"https:\/\/ctrl\.evoq\.app\/api\/auth\/logout\?continue=one"/, 'fallback chain present');
    assert.ok(!html.includes(USER), 'no user details in the page');
    const csp = res.headers.get('content-security-policy') || '';
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /script-src 'nonce-[A-Za-z0-9+/=]+'/);
    assert.match(csp, /connect-src https:\/\/ctrl\.evoq\.app https:\/\/one\.evoq\.app/);
    assert.match(html, new RegExp(`<script nonce="${/'nonce-([^']+)'/.exec(csp)![1].replace(/[+/=]/g, '\\$&')}">`));
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
    assert.strictEqual(res.headers.get('clear-site-data'), null, 'no slow Clear-Site-Data');
    const set = setCookies(res);
    assert.ok(set.some((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`) && /Max-Age=0/i.test(c)));
    assert.strictEqual(retryValue(res), undefined, 'no retry cookie when signed out');
  });

  test('Central refuses or times out: the page says so, offers Try again, and does not claim success', async () => {
    for (const answer of [() => new Response('{}', { status: 503 }), () => { throw new Error('timeout'); }]) {
      central(answer as any);
      const res = await logoutPost(post('/api/auth/logout', { [SESSION_COOKIE_NAME]: cookie() }));
      const html = await res.text();
      assert.match(html, /data-state="not_confirmed"/);
      assert.match(html, /couldn't finish signing you out everywhere/);
      assert.match(html, /action="\/api\/auth\/logout\/retry"/);
      assert.ok(!/signed out of EVOQ on all your devices/.test(html));
      assert.ok(setCookies(res).some((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`) && /Max-Age=0/i.test(c)), 'CRM session still ends here');
      const retry = setCookies(res).find((c) => c.startsWith(`${RETRY_COOKIE}=`))!;
      assert.match(retry, /HttpOnly/i); assert.match(retry, /SameSite=strict/i); assert.match(retry, /Path=\/api\/auth\/logout/);
    }
    assert.ok(SIGN_OUT_TIMEOUT_MS <= 5000, 'Central is waited for at most 5 s');
  });

  test('Try again signs out the user named in the signed retry cookie', async () => {
    central(() => new Response('{}', { status: 503 }));
    const first = await logoutPost(post('/api/auth/logout', { [SESSION_COOKIE_NAME]: cookie() }));
    const token = retryValue(first)!;
    central(ok);
    const res = await retryPost(post('/api/auth/logout/retry', { [RETRY_COOKIE]: token }));
    assert.strictEqual(calls[0].body.user_id, USER);
    assert.match(await res.text(), /data-state="signed_out"/);
    assert.ok(setCookies(res).some((c) => c.startsWith(`${RETRY_COOKIE}=`) && /Max-Age=0/i.test(c)), 'retry cookie removed');
  });

  test('retry cookie cannot be forged, reused as a session, or used as one', async () => {
    central(ok);
    const forged = signForPurpose('crm-global-signout-retry', { userId: 'victim@example.com' }, 600).replace(/\.[^.]+$/, '.bad');
    await retryPost(post('/api/auth/logout/retry', { [RETRY_COOKIE]: forged }));
    await retryPost(post('/api/auth/logout/retry', { [RETRY_COOKIE]: cookie('victim@example.com') }));
    assert.strictEqual(calls.length, 0, 'a session cookie is not a retry token');
    const t = signForPurpose('crm-global-signout-retry', { userId: USER }, 600);
    assert.strictEqual(parseSession(t), null, 'a retry token is not a session');
    assert.strictEqual(verifyForPurpose('other', t), null);
    assert.strictEqual(verifyForPurpose('crm-global-signout-retry', signForPurpose('crm-global-signout-retry', { userId: USER }, -1)), null, 'expired');
  });

  test('GET (old link) walks the chain that now ends on the CRM product page', async () => {
    central(ok);
    const res = await logoutGet(new NextRequest('https://crm.evoq.app/api/auth/logout'));
    assert.strictEqual(res.status, 303);
    assert.strictEqual(res.headers.get('location'), 'https://ctrl.evoq.app/api/auth/logout?continue=one');
    assert.strictEqual(calls.length, 0);
  });
});

describe('R60 data-loading fixes', () => {
  const src = (p: string) => readFileSync(join(ROOT, 'src', p), 'utf8');
  test('related lists on contact/account pages use Frappe filters, not raw SQL', () => {
    for (const [file, filter] of [
      ['components/Contact/Detail/DealListing.tsx', /field: "CRM Contacts", key: "contact", operator: "="/],
      ['components/Customer/Detail/OrgDealListing.tsx', /field: "CRM Deal", key: "organization", operator: "="/],
      ['components/Customer/Detail/OrgContactListing.tsx', /field: "Contact", key: "company_name", operator: "="/],
      ['components/Contact/Detail/AddressListing.tsx', /field: "Dynamic Link", key: "link_name", operator: "="/],
    ] as const) {
      const s = src(file);
      assert.match(s, filter, file);
      assert.ok(!/whereconditon\s*=/.test(s) && !/Joinquery\s*=/.test(s), `${file} has no SQL fragments`);
    }
  });
  test('task attachments belong to the task', () => {
    assert.match(src('components/Tasks/Detail/Tabs/Attachments.tsx'), /attachedToDoctype="CRM Task"/);
  });
  test('a failed list load is not shown as 0 records', () => {
    const g = src('components/Common/DataGrid/RawDynamicDataGrid.tsx');
    assert.match(g, /total: loadError \? undefined : Number\(rowCount\)/);
    assert.match(g, /noRowsLabel=\{loadError \? "Records could not be loaded\." : undefined\}/);
    assert.match(g, /href="\/api\/auth\/session-ended"/);
  });
  test('My Account says when the profile cannot be shown instead of an empty form', () => {
    // R63: My Account moved to the secured user-management component (still shows a message, never an empty form).
    assert.match(src('components/UserManagement/MyAccount.tsx'), /data-testid='my-account-unavailable'/);
  });
});
