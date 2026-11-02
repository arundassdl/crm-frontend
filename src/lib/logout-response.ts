import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, signForPurpose } from '@/lib/session';
import { getCtrlLogoutContinueUrl, getOneCrmProductUrl, getSignInClearUrls } from '@/lib/global-logout';
import { LogoutPageState, logoutPage } from '@/lib/logout-page';

/** R60 (doc 64): responses shared by the logout and retry routes. */
export const LEGACY_COOKIES = ['isLoggedIn', 'userCompanyData', 'userProfileData', 'userAddress'];
export const RETRY_COOKIE = 'evoq_crm_signout_retry';
export const RETRY_PURPOSE = 'crm-global-signout-retry';
const RETRY_TTL_SECONDS = 600;
const secure = () => process.env.NODE_ENV === 'production';

export function clearCrmCookies(res: NextResponse): NextResponse {
  const expired = { path: '/', maxAge: 0, expires: new Date(0) };
  res.cookies.set(SESSION_COOKIE_NAME, '', { ...expired, httpOnly: true, secure: secure(), sameSite: 'lax' });
  for (const name of LEGACY_COOKIES) res.cookies.set(name, '', expired);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export function renderLogout(state: LogoutPageState, retryForUser?: string | null): NextResponse {
  const clear = getSignInClearUrls();
  const { html, csp } = logoutPage(state, {
    destination: getOneCrmProductUrl(),
    fallback: getCtrlLogoutContinueUrl(),
    clearCtrl: clear.ctrl,
    clearOne: clear.one,
  });
  const res = new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  clearCrmCookies(res);
  const retryOpts = { httpOnly: true, secure: secure(), sameSite: 'strict' as const, path: '/api/auth/logout' };
  if (state === 'not_confirmed' && retryForUser) {
    res.cookies.set(RETRY_COOKIE, signForPurpose(RETRY_PURPOSE, { userId: retryForUser }, RETRY_TTL_SECONDS), {
      ...retryOpts,
      maxAge: RETRY_TTL_SECONDS,
    });
  } else {
    res.cookies.set(RETRY_COOKIE, '', { ...retryOpts, maxAge: 0, expires: new Date(0) });
  }
  return res;
}

