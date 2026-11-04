export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { getOneSigninUrl, safeCrmPath } from '@/lib/one';
import { embedSigninUrl, isFrameRequest } from '@/lib/embed';

/**
 * R59 (doc 63): a page was opened with a CRM session that Central refused (the user signed out
 * everywhere). Drop this browser's CRM cookies and go to Evoq One sign-in, keeping a safe CRM path.
 */
export async function GET(req: NextRequest) {
  const next = safeCrmPath(req.nextUrl.searchParams.get('next'));
  // newdocs/80: inside CTRL, CTRL relaunches (or asks the person to sign in) — never Evoq One in the frame.
  const res = NextResponse.redirect(
    isFrameRequest(req.headers) ? embedSigninUrl(req.nextUrl.origin, next) : getOneSigninUrl(next),
    303,
  );
  const expired = { path: '/', maxAge: 0, expires: new Date(0) };
  res.cookies.set(SESSION_COOKIE_NAME, '', { ...expired, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.cookies.set('isLoggedIn', '', expired);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
