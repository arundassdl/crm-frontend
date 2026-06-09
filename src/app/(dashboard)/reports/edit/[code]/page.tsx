import ReportsEditHost from '@/components/reports/ReportsEditHost'

type PageProps = {
  params: { code: string }
}

/**
 * `/reports/edit/QRY-0010` — CRM route; federated **`reports/ReportEdit`**.
 * Link builders: **`reportEditUrl`** in `src/lib/reports/reportRoutes.ts`.
 */
export default function ReportsEditPage({ params }: PageProps) {
  const code = decodeURIComponent(params.code ?? '')
  return <ReportsEditHost code={code} />
}
