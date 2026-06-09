import ReportsCreateHost from '@/components/reports/ReportsCreateHost'

type PageProps = {
  searchParams: { module?: string | string[] }
}

function firstParam(v: string | string[] | undefined): string {
  if (v == null) return ''
  return typeof v === 'string' ? v : v[0] ?? ''
}

/**
 * CRM **`/reports/create`** — federated report builder shell (`reports/ReportBuilder`).
 * **`?module=`** carries the primary module chosen in the Create Report dialog (e.g. **`CRM Lead`**).
 */
export default function ReportsCreatePage({ searchParams }: PageProps) {
  const moduleParam = firstParam(searchParams?.module)
  return <ReportsCreateHost primaryModule={moduleParam} />
}
