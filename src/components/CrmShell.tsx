// Shared CRM application shell (R56): sidebar, header, footer around page content.
// Every authenticated CRM layout uses this, including /org/[orgid], so the shell
// cannot drift between routes again.
import type { ReactNode } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import { CrmSessionProvider } from '@/components/CrmSessionContext'
import { SESSION_COOKIE_NAME, parseSession } from '@/lib/session'
import BackNavigationGuard from '@/components/BackNavigationGuard'
import { PageOrganization } from '@/components/EmbedBridge'
import { TenantResolverError, resolveTenant } from '@/lib/tenant-resolver'

/**
 * R59 (doc 63): a session Central refuses because the user signed out everywhere never gets the
 * page, even on another device or with a copied cookie. Same check (and 60 s cache) as every data
 * call; any other resolver problem is left to the page's own error states, as before.
 */
async function signedOutEverywhere(userId: string, organization: string, application: string, createdAt: number) {
  try {
    await resolveTenant(userId, organization, application, createdAt)
    return false
  } catch (err) {
    return err instanceof TenantResolverError && err.code === 'SESSION_REVOKED'
  }
}

async function CrmShell({ children }: { children: ReactNode }) {
  const session = parseSession(cookies().get(SESSION_COOKIE_NAME)?.value)
  if (session && (await signedOutEverywhere(session.userId, session.organization, session.application || 'crm', session.createdAt))) {
    const path = headers().get('x-evoq-path') || ''
    redirect(`/api/auth/session-ended${path ? `?next=${encodeURIComponent(path)}` : ''}`)
  }
  // Only the organization id and user email reach the browser; the cookie stays httpOnly.
  const info = session ? { organization: session.organization, userId: session.userId } : null

  return (
    <CrmSessionProvider value={info}>
      <BackNavigationGuard />
      {/* EM-6 (newdocs/80): the organization this page was drawn for. */}
      <PageOrganization value={info?.organization ?? null} />
      <Providers direction='ltr'>
        <LayoutWrapper
          verticalLayout={
            <VerticalLayout navigation={<Navigation />} navbar={<Navbar />} footer={<VerticalFooter />}>
              {children}
            </VerticalLayout>
          }
        />
      </Providers>
    </CrmSessionProvider>
  )
}

// Async Server Component; TypeScript 5.0 (this project) cannot type one as JSX, so its props type is kept.
export default CrmShell as unknown as (props: { children: ReactNode }) => JSX.Element
