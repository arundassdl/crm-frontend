import type { ChartKind } from '../types'

/** Maps Insights Query `chart_type` (or saved jsonobject value) to dashboard chart kind. */
export function mapApiChartTypeToChartKind(chartType: string | null | undefined): ChartKind {
  const raw = (chartType ?? '').trim().toLowerCase()
  if (!raw) return 'bar'

  if (raw === 'pie') return 'pie'
  if (raw === 'donut' || raw === 'doughnut') return 'donut'
  if (raw === 'line') return 'line'
  if (raw === 'area') return 'area'
  if (raw === 'funnel') return 'funnel'
  if (raw === 'bar' || raw === 'column' || raw === 'row') return 'bar'

  return 'bar'
}
