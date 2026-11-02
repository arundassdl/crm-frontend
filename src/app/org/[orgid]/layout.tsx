import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, parseSession } from '@/lib/session';
import { getCtrlCrmLaunchUrl, getOneSigninUrl } from '@/lib/one';
import CrmShell from '@/components/CrmShell';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: { orgid: string };
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const cookieStore = cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSession(rawSession);

  if (!session) {
    // R58: no valid CRM session → Evoq One CRM sign-in (never the legacy password login).
    redirect(getOneSigninUrl(`/org/${params.orgid}/`));
  }

  // Cross-organization boundary: If path org does not match active session org
  if (session.organization !== params.orgid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Organization Access Denied</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your current session is authorized for organization{' '}
            <span className="font-semibold">{session.organization}</span>, but you attempted to
            access organization <span className="font-semibold">{params.orgid}</span>.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <a
              href={`/org/${session.organization}/`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              Switch to {session.organization}
            </a>
            {/* R58: CTRL checks membership in Central before opening another organization. */}
            <a
              href={getCtrlCrmLaunchUrl(params.orgid)}
              className="text-sm text-blue-600 hover:underline"
              data-testid="org-denied-switch"
            >
              Open {params.orgid} if you are a member
            </a>
          </div>
        </div>
      </div>
    );
  }

  // R56: render inside the shared CRM shell (sidebar + header), like every module page.
  // "Switch organization" now lives in the header's account menu.
  return (
    <CrmShell>
      <div className="evoq-org-container" data-org={params.orgid}>
        {children}
      </div>
    </CrmShell>
  );
}
