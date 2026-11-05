import ReportsRemoteHost from '@/components/reports/ReportsRemoteHost'

type PageProps = {
  params: Promise<{ value: string }>
}

/**
 * `/report/QRY-0003` — same federated listing/detail surface as `/reports`, with `reportCode` from the path.
 */
export default async function ReportByCodePage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise
  const code = decodeURIComponent(params.value ?? '')
  return <ReportsRemoteHost reportCode={code} />
}
