import ReportsRemoteHost from '@/components/reports/ReportsRemoteHost'

type PageProps = {
  params: { value: string }
}

/**
 * `/report/QRY-0003` — same federated listing/detail surface as `/reports`, with `reportCode` from the path.
 */
export default function ReportByCodePage({ params }: PageProps) {
  const code = decodeURIComponent(params.value ?? '')
  return <ReportsRemoteHost reportCode={code} />
}
