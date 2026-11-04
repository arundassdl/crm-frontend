export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ctrlOrigin, isFrameRequest } from '@/lib/embed';
import { getOneSigninUrl, safeCrmPath } from '@/lib/one';

/**
 * newdocs/80 §5.4: a page inside CTRL's frame has no CRM session. CTRL relaunches the frame through
 * its own launch (a fresh ticket) or, if CTRL's session is gone too, asks the person to sign in at the
 * top level. Nothing here signs anyone in: it only tells CTRL. Opened at the top level (not framed),
 * it is the standalone sign-in redirect, unchanged.
 */
export async function GET(req: NextRequest) {
  const next = safeCrmPath(req.nextUrl.searchParams.get('next'));
  const one = getOneSigninUrl(next);
  if (!isFrameRequest(req.headers)) {
    const res = NextResponse.redirect(one, 307);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  const ctrl = ctrlOrigin();
  const nonce = crypto.randomBytes(16).toString('base64');
  const message = { evoq: 1, type: 'signin-required', ...(next ? { path: next } : {}) };
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>EVOQ CRM</title></head><body>' +
    `<script nonce="${nonce}">` +
    `if (window.parent !== window) window.parent.postMessage(${JSON.stringify(message)}, ${JSON.stringify(ctrl)});` +
    `else window.location.replace(${JSON.stringify(one)});` +
    '</script></body></html>';
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'self' ${ctrl}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
