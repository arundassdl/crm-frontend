/** True when Insights Query `chart_type` should render as a table on the dashboard. */
export function isTableChartType(chartType: string | null | undefined): boolean {
  return (chartType ?? '').trim().toLowerCase() === 'table'
}
