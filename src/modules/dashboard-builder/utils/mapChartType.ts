import type { ChartKind } from '../types'

/** Maps Insights Query `chart_type` (or saved jsonobject value) to dashboard chart kind. */
export function mapApiChartTypeToChartKind(chartType: string | null | undefined): ChartKind {
  const raw = (chartType ?? '').trim().toLowerCase()
  if (!raw) return 'column'

  if (raw === 'pie') return 'pie'
  if (raw === 'donut' || raw === 'doughnut') return 'donut'
  if (raw === 'line') return 'line'
  if (raw === 'area') return 'area'
  if (raw === 'funnel') return 'funnel'
  if (raw === 'treemap') return 'treemap'
  if (raw === 'butterfly') return 'butterfly'
  if (raw === 'live') return 'live'
  if (raw === 'bar' || raw === 'row') return 'bar'
  if (raw === 'column') return 'column'
  if (raw === 'scatter') return 'scatter'
  if (raw === 'progress') return 'progress'

  return 'column'
}
