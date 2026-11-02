export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  CrmSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  getSessionCookieOptions,
  serializeSession,
} from '@/lib/session';

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

  const expectedPrefix = `/org/${organization}/`;
  if (!trimmed.startsWith(expectedPrefix) && trimmed !== `/org/${organization}`) {
    return fallback;
  }

  return trimmed;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ticket = searchParams.get('ticket');
  const returnTo = searchParams.get('return_to');

  if (!ticket || !ticket.trim()) {
    return NextResponse.json(
      { error: 'MISSING_TICKET', message: 'Launch ticket is required.' },
      { status: 400 },
    );
  }

  const centralBaseUrl = (
    process.env.CENTRAL_BASE_URL ||
    process.env.NEXT_PUBLIC_CENTRAL_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');

  const redeemUrl = `${centralBaseUrl}/api/method/evoq_saas_package_layer.api.internal_launch_tickets.redeem`;

  let response: Response;
  try {
    response = await fetch(redeemUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ticket: ticket.trim(),
        application: 'crm',
      }),
      cache: 'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'CENTRAL_UNAVAILABLE', message: 'Single Sign-On provider is unavailable.' },
      { status: 503 },
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data || data.status === 'error') {
    const status = response.status === 401 || response.status === 403 ? response.status : 401;
    const code = data?.code || (status === 403 ? 'APPLICATION_MISMATCH' : 'TICKET_INVALID_OR_EXPIRED');
    const message = data?.message || 'Launch ticket is invalid or has expired.';

    return NextResponse.json(
      { error: code, message },
      { status },
    );
  }

  const sessionData = data.message?.session || data.session;
  if (!sessionData || !sessionData.user_id || !sessionData.organization) {
    return NextResponse.json(
      { error: 'INVALID_SESSION_DATA', message: 'Failed to extract verified session from launch ticket.' },
      { status: 502 },
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

  // Set host-only session cookie
  res.cookies.set(SESSION_COOKIE_NAME, serializedCookie, cookieOptions);
  // Also set legacy compatibility cookie
  res.cookies.set('isLoggedIn', 'true', {
    ...cookieOptions,
    httpOnly: false, // Legacy client components inspect isLoggedIn
  });

  return res;
}
