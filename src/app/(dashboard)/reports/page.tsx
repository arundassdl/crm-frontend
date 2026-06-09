'use client'

import { useRouter } from 'next/navigation'
import ReportsRemoteHost from '@/components/reports/ReportsRemoteHost'

/**
 * CRM `/reports` — federated reports-app listing (`reportCode` unset).
 * Create Report popup and navigation are delegated to the remote; CRM supplies module choices and **`Continue`** routing.
 */
export default function ReportsPage() {
  const router = useRouter()

  return (
    <ReportsRemoteHost
      createReportPrimaryModuleOptions={[
        { value: 'CRM Lead', label: 'Leads' },
        { value: 'CRM Deal', label: 'Deals' },
        { value: 'Contact', label: 'Contacts' },
      ]}
      onCreateReportContinue={(primaryModule) => {
        router.push(`/reports/create?module=${encodeURIComponent(primaryModule)}`)
      }}
    />
  )
}
