import ReportsEditHost from '@/components/reports/ReportsEditHost'

type PageProps = {
  params: Promise<{ code: string }>
}

/**
 * `/reports/edit/QRY-0010` — CRM route; federated **`reports/ReportEdit`**.
 * Link builders: **`reportEditUrl`** in `src/lib/reports/reportRoutes.ts`.
 */
export default async function ReportsEditPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise
  const code = decodeURIComponent(params.code ?? '')
  return <ReportsEditHost code={code} />
}
