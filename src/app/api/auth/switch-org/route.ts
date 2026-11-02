export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { getCtrlCrmLaunchUrl } from '@/lib/one';

// Clears the CRM BFF session cookies and sends the user to CTRL's organization chooser (R58).
// No separate auth system: CTRL issues a new launch ticket, redeemed by /api/auth/launch.
export async function GET() {
  const res = NextResponse.redirect(getCtrlCrmLaunchUrl(), 302);
  const expired = { path: '/', maxAge: 0, expires: new Date(0) };
  res.cookies.set(SESSION_COOKIE_NAME, '', { ...expired, httpOnly: true });
  res.cookies.set('isLoggedIn', '', expired);
  return res;
}
