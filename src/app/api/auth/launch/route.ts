export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  CrmSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  getSessionCookieOptions,
  serializeSession,
} from '@/lib/session';
import { centralRequestHeaders, getCentralBaseUrl } from '@/lib/central';

function sanitizeReturnTo(candidate: string | null | undefined, organization: string): string {
  const fallback = `/org/${organization}/`;
  if (!candidate || typeof candidate !== 'string') return fallback;

  const trimmed = candidate.trim();
  // Disallow scheme, protocol, backslashes, or authority
  if (
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('://') ||
    !trimmed.startsWith('/')
  ) {
    return fallback;
  }

  // R58: a CRM module page preserved across sign-in (fixed list, relative, same origin).
  if (/^\/(leads|deals|contacts|accounts|tasks)(\/[A-Za-z0-9_-]{1,64})*\/?$/.test(trimmed)) {
    return trimmed;
  }

  const expectedPrefix = `/org/${organization}/`;
  if (!trimmed.startsWith(expectedPrefix) && trimmed !== `/org/${organization}`) {
    return fallback;
  }

  return trimmed;
}

function launchSecurityHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'Referrer-Policy': 'no-referrer',
  };
}

function errorResponse(code: string, message: string, status: number) {
  const res = NextResponse.json({ error: code, message }, { status });
  for (const [k, v] of Object.entries(launchSecurityHeaders())) {
    res.headers.set(k, v);
  }
  return res;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ticket = searchParams.get('ticket');
  const returnTo = searchParams.get('return_to');

  if (!ticket || !ticket.trim()) {
    return errorResponse('MISSING_TICKET', 'Launch ticket is required.', 400);
  }

  const centralBaseUrl = getCentralBaseUrl();
  const redeemUrl = `${centralBaseUrl}/api/method/evoq_saas_package_layer.api.internal_launch_tickets.redeem`;

  let response: Response;
  try {
    response = await fetch(redeemUrl, {
      method: 'POST',
      headers: centralRequestHeaders(),
      body: JSON.stringify({
        ticket: ticket.trim(),
        application: 'crm',
      }),
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return errorResponse(
      'CENTRAL_UNAVAILABLE',
      'Single Sign-On provider is unavailable.',
      503,
    );
  }

  const data = await response.json().catch(() => null);
  // Frappe nests whitelisted returns under `message`
  const payload =
    data && typeof data.message === 'object' && data.message !== null ? data.message : data;

  if (!response.ok || !payload || payload.status === 'error') {
    const status =
      response.status === 401 || response.status === 403
        ? response.status
        : payload?.http_status || 401;
    const code =
      payload?.code ||
      (status === 403 ? 'APPLICATION_MISMATCH' : 'TICKET_INVALID_OR_EXPIRED');
    const message =
      (typeof payload?.message === 'string' && payload.message) ||
      'Launch ticket is invalid or has expired.';

    return errorResponse(code, message, status === 404 ? 401 : status);
  }

  const sessionData = payload.session || data?.session;
  if (!sessionData || !sessionData.user_id || !sessionData.organization) {
    return errorResponse(
      'INVALID_SESSION_DATA',
      'Failed to extract verified session from launch ticket.',
      502,
    );
  }

  const organization = sessionData.organization;
  const sanitizedTarget = sanitizeReturnTo(returnTo || sessionData.callback_path, organization);

  const now = Date.now();
  const session: CrmSession = {
    userId: sessionData.user_id,
    evoqUserKey: sessionData.evoq_user_key || '',
    organization,
    application: 'crm',
    createdAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };

  const serializedCookie = serializeSession(session);
  const cookieOptions = getSessionCookieOptions(process.env.NODE_ENV === 'production');

  const redirectUrl = new URL(sanitizedTarget, req.nextUrl.origin);
  const res = NextResponse.redirect(redirectUrl, 302);
  for (const [k, v] of Object.entries(launchSecurityHeaders())) {
    res.headers.set(k, v);
  }

  // Host-only session cookie (never Domain=.evoq.app)
  res.cookies.set(SESSION_COOKIE_NAME, serializedCookie, cookieOptions);
  res.cookies.set('isLoggedIn', 'true', {
    ...cookieOptions,
    httpOnly: false, // Legacy client components inspect isLoggedIn
  });

  return res;
}
