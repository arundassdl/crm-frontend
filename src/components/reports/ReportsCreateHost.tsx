'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ReportsMfHostChrome } from '@/components/reports/ReportsMfHostChrome'
import {
  loadReportsBuilderModuleSafe,
  reportsBuilderDynamicOptions,
} from '@/lib/mf/loadReportsBuilderModule'
import {
  getReportsEmbedApiConfig,
  readReportsRemoteSessionForDetail,
} from '@/lib/reportsEmbed/reportsEmbedConfig'
import {
  REPORTS_DETAIL_HREF_PREFIX,
  REPORTS_EDIT_HREF_PREFIX,
  REPORTS_LIST_HREF,
} from '@/lib/reports/reportRoutes'

const ReportBuilder = dynamic(
  () => loadReportsBuilderModuleSafe(),
  {
    ...reportsBuilderDynamicOptions,
  }
)

export type ReportsCreateHostProps = {
  /** From **`?module=`** (decoded). Host may also resolve from search in-app. */
  primaryModule?: string
}

/**
 * Federated **`reports/ReportBuilder`** for CRM **`/reports/create`**, with API/session context aligned to listing/detail.
 */
export default function ReportsCreateHost({
  primaryModule: primaryModuleProp,
}: ReportsCreateHostProps) {
  const pathname = usePathname() ?? ''
  const apiConfig = useMemo(() => getReportsEmbedApiConfig(), [])
  const [session, setSession] = useState(() => readReportsRemoteSessionForDetail())

  const primaryModule = primaryModuleProp?.trim() || undefined

  const crmReportPath =
    pathname && primaryModule
      ? `${pathname}?module=${encodeURIComponent(primaryModule)}`
      : pathname

  const mountKey = `reports-create:${primaryModule ?? 'default'}`

  useEffect(() => {
    setSession(readReportsRemoteSessionForDetail())
  }, [])

  return (
    <ReportsMfHostChrome mountKey={mountKey} rootId="reports-create-root">
      <ReportBuilder
        key={mountKey}
        {...apiConfig}
        userToken={session.userToken}
        token={session.token}
        username={session.username}
        userRole={session.userRole}
        crmReportPath={crmReportPath}
        crmReportsListingHref={REPORTS_LIST_HREF}
        crmReportsDetailHrefPrefix={REPORTS_DETAIL_HREF_PREFIX}
        crmReportsEditHrefPrefix={REPORTS_EDIT_HREF_PREFIX}
        primaryModule={primaryModule}
        module={primaryModule}
      />
    </ReportsMfHostChrome>
  )
}
