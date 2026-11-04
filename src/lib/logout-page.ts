/**
 * R60 (doc 64): the page the browser gets back from CRM logout.
 *
 * By the time it is sent, Central has already signed the user out everywhere (or reported that it
 * could not). The page then clears the CTRL and Evoq One sign-in cookies in parallel — each site
 * clears only its own, through an endpoint that does nothing else — and goes straight to the
 * Evoq One CRM page. If either clear does not answer in time, it falls back to the redirect chain
 * (CRM → CTRL → Evoq One), which clears the same cookies by navigation and ends on the same page.
 *
 * No data, tokens or user details are in the page. Its own Content-Security-Policy allows only its
 * one inline script (nonce), requests to the two clear endpoints, and a form post back to CRM.
 */
import crypto from 'crypto';

export type LogoutPageState = 'signed_out' | 'not_confirmed';

export interface LogoutPageUrls {
  destination: string; // Evoq One CRM page
  fallback: string; // CTRL ?continue=one chain, ends on the destination
  clearCtrl: string;
  clearOne: string;
}

const CLEAR_TIMEOUT_MS = 2500;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function logoutPage(state: LogoutPageState, urls: LogoutPageUrls): { html: string; csp: string } {
  const nonce = crypto.randomBytes(16).toString('base64');
  const confirmed = state === 'signed_out';
  const origins = [urls.clearCtrl, urls.clearOne].map((u) => new URL(u).origin).join(' ');
  // newdocs/80: CTRL may frame CRM; inside its frame the page tells CTRL instead of leaving for Evoq One.
  const ctrl = new URL(urls.clearCtrl).origin;
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    "style-src 'unsafe-inline'",
    `connect-src ${origins}`,
    "form-action 'self'",
    "base-uri 'none'",
    `frame-ancestors 'self' ${ctrl}`,
  ].join('; ');

  const body = confirmed
    ? `<div class="spin" aria-hidden="true"></div>
       <h1>Signing you out…</h1>
       <p>You have been signed out of EVOQ on all your devices.</p>
       <noscript><p><a href="${esc(urls.fallback)}">Continue</a></p></noscript>`
    : `<h1>We couldn't finish signing you out everywhere</h1>
       <p>You are signed out of EVOQ CRM in this browser. EVOQ sign-in did not confirm signing you out on your other devices.</p>
       <form method="post" action="/api/auth/logout/retry"><button type="submit">Try again</button></form>
       <p><a href="${esc(urls.fallback)}">Continue without retrying</a></p>`;

  const script = `
(function () {
  var dest = ${JSON.stringify(urls.destination)}, fallback = ${JSON.stringify(urls.fallback)}, go = ${confirmed};
  var framed = window.parent !== window, ctrl = ${JSON.stringify(ctrl)};
  function clear(url) {
    var ctl = new AbortController(); var t = setTimeout(function () { ctl.abort(); }, ${CLEAR_TIMEOUT_MS});
    return fetch(url, { credentials: 'include', mode: 'cors', cache: 'no-store', signal: ctl.signal })
      .then(function (r) { clearTimeout(t); return r.ok; }, function () { clearTimeout(t); return false; });
  }
  Promise.all([clear(${JSON.stringify(urls.clearCtrl)}), clear(${JSON.stringify(urls.clearOne)})]).then(function (ok) {
    if (!go) return;
    if (framed) { window.parent.postMessage({ evoq: 1, type: 'signed-out' }, ctrl); return; }
    window.location.replace(ok[0] && ok[1] ? dest : fallback);
  });
})();`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Signing out · EVOQ</title>
<style>
:root{color-scheme:light dark;--bg:#f5f7fb;--card:#fff;--text:#1f2937;--muted:#6b7280;--accent:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#0f172a;--card:#111827;--text:#e5e7eb;--muted:#9ca3af;--accent:#60a5fa}}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{background:var(--card);padding:32px 28px;border-radius:12px;max-width:420px;margin:16px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
h1{font-size:20px;margin:12px 0 8px}p{color:var(--muted);margin:8px 0}a{color:var(--accent)}
button{background:var(--accent);color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:15px;cursor:pointer;margin-top:12px}
.spin{width:28px;height:28px;border:3px solid var(--muted);border-top-color:var(--accent);border-radius:50%;margin:0 auto;animation:s .8s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}
.brand{font-weight:700;letter-spacing:.08em;color:var(--accent)}
</style></head>
<body><main data-testid="crm-logout-page" data-state="${state}"><div class="brand">EVOQ</div>${body}</main>
<script nonce="${nonce}">${script}</script></body></html>`;
  return { html, csp };
}
