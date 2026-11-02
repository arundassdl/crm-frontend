import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, parseSession } from '@/lib/session';
import { getOneSigninUrl } from '@/lib/one';

/** R56: "/org" (e.g. the breadcrumb) goes to the session organization's CRM home. */
export default function OrgIndexPage() {
  const session = parseSession(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect(getOneSigninUrl());
  redirect(`/org/${encodeURIComponent(session.organization)}`);
}
