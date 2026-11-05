import ReportsDetailHost from '@/components/reports/ReportsDetailHost'

type PageProps = {
  params: Promise<{ name: string }>
}

/**
 * `/reports/details/QRY-0003` — CRM route; federated **`reports/ReportDetail`**.
 * Link builders: **`reportDetailUrl`** in `src/lib/reports/reportRoutes.ts`.
 */
export default async function ReportsDetailPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise
  const decodedName = decodeURIComponent(params.name ?? '')
  return <ReportsDetailHost name={decodedName} />
}
