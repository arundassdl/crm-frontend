'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { ReportsMfHostChrome } from '@/components/reports/ReportsMfHostChrome'
import {
  loadReportsEditModuleSafe,
  reportsEditDynamicOptions,
} from '@/lib/mf/loadReportsEditModule'
import {
  REPORTS_DETAIL_HREF_PREFIX,
  REPORTS_EDIT_HREF_PREFIX,
  REPORTS_LIST_HREF,
  reportEditUrl,
} from '@/lib/reports/reportRoutes'
import {
  getReportsEmbedApiConfig,
  readReportsRemoteSessionForDetail,
} from '@/lib/reportsEmbed/reportsEmbedConfig'

const ReportEdit = dynamic(() => loadReportsEditModuleSafe(), {
  ...reportsEditDynamicOptions,
})

export type ReportsEditHostProps = {
  /** Decoded route param from `/reports/edit/[code]`. */
  code: string
}

/**
 * Federated **`reports/ReportEdit`** for CRM **`/reports/edit/[code]`** — loads existing report by Insights Query code.
 */
export default function ReportsEditHost({ code }: ReportsEditHostProps) {
  const apiConfig = useMemo(() => getReportsEmbedApiConfig(), [])
  const [session, setSession] = useState(() => readReportsRemoteSessionForDetail())

  const trimmed = code.trim()
  const mountKey = `reports-edit:${trimmed}`
  const crmReportPath = reportEditUrl(trimmed)

  useEffect(() => {
    setSession(readReportsRemoteSessionForDetail())
  }, [])

  return (
    <ReportsMfHostChrome mountKey={mountKey} rootId="reports-edit-root">
      <ReportEdit
        key={mountKey}
        reportId={trimmed}
        name={trimmed}
        reportCode={trimmed}
        queryName={trimmed}
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
