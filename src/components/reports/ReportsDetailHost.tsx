'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { ReportsMfHostChrome } from '@/components/reports/ReportsMfHostChrome'
import {
  loadReportsDetailModuleSafe,
  reportsDetailDynamicOptions,
} from '@/lib/mf/loadReportsDetailModule'
import {
  REPORTS_DETAIL_HREF_PREFIX,
  REPORTS_EDIT_HREF_PREFIX,
  REPORTS_LIST_HREF,
  reportDetailUrl,
} from '@/lib/reports/reportRoutes'
import {
  getReportsEmbedApiConfig,
  readReportsRemoteSessionForDetail,
} from '@/lib/reportsEmbed/reportsEmbedConfig'

const ReportDetail = dynamic(
  () => loadReportsDetailModuleSafe(),
  {
    ...reportsDetailDynamicOptions,
  }
)

export type ReportsDetailHostProps = {
  /** Decoded route param from `/reports/details/[name]`. */
  name: string
}

/**
 * Federated **`reports/ReportDetail`** shell — same CRM API/session context as listing; **`name`** drives which report loads inside the remote.
 * Passes **`crmReportsListingHref`** / **`crmReportsDetailHrefPrefix`** so back navigation targets **`/reports`**, not the standalone **`/listing`** route.
 */
export default function ReportsDetailHost({ name }: ReportsDetailHostProps) {
  const apiConfig = useMemo(() => getReportsEmbedApiConfig(), [])
  const [session, setSession] = useState(() => readReportsRemoteSessionForDetail())

  const trimmed = name.trim()
  const mountKey = `reports-detail:${trimmed}`
  const crmReportPath = reportDetailUrl(trimmed)

  useEffect(() => {
    setSession(readReportsRemoteSessionForDetail())
  }, [])

  return (
    <ReportsMfHostChrome mountKey={mountKey} rootId="reports-detail-root">
      <ReportDetail
        key={mountKey}
        name={trimmed}
        userToken={session.userToken}
        token={session.token}
        username={session.username}
        userRole={session.userRole}
        API_BASE_URL={apiConfig.API_BASE_URL}
        API_MANDATE_PARAMS={apiConfig.API_MANDATE_PARAMS}
        VERSION={apiConfig.VERSION}
        APPCODE={apiConfig.APPCODE}
        crmReportPath={crmReportPath}
        crmReportsListingHref={REPORTS_LIST_HREF}
        crmReportsDetailHrefPrefix={REPORTS_DETAIL_HREF_PREFIX}
        crmReportsEditHrefPrefix={REPORTS_EDIT_HREF_PREFIX}
      />
    </ReportsMfHostChrome>
  )
}
