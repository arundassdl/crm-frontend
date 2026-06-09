import ReportsDetailHost from '@/components/reports/ReportsDetailHost'

type PageProps = {
  params: { name: string }
}

/**
 * `/reports/details/QRY-0003` — CRM route; federated **`reports/ReportDetail`**.
 * Link builders: **`reportDetailUrl`** in `src/lib/reports/reportRoutes.ts`.
 */
export default function ReportsDetailPage({ params }: PageProps) {
  const decodedName = decodeURIComponent(params.name ?? '')
  return <ReportsDetailHost name={decodedName} />
}
