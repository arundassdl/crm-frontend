import type { EChartsOption } from 'echarts'

import type { QuickChartFormState } from '../types/quickChart'

const PREVIEW_COLORS = ['#f59e0b', '#eab308', '#3b82f6', '#10b981', '#8b5cf6']

function previewCategories(groupingLabel: string): { categories: string[]; values: number[] } {
  const seed = groupingLabel.trim().toLowerCase()
  if (seed.includes('created')) {
    return { categories: ['Charles', 'Mary'], values: [1, 2] }
  }
  if (seed.includes('owner')) {
    return { categories: ['Alex', 'Jordan', 'Sam'], values: [3, 2, 4] }
  }
  return {
    categories: ['Group A', 'Group B', 'Group C'],
    values: [2, 4, 3],
  }
}

/** Live preview option for the Quick Chart dialog. */
export function buildQuickChartPreviewOption(
  form: QuickChartFormState,
  options?: {
    measureLabel?: string
    groupingLabel?: string
  }
): EChartsOption {
  const groupingLabel = options?.groupingLabel ?? form.grouping
  const { categories, values } = previewCategories(groupingLabel)
  const measureLabel = options?.measureLabel ?? 'Measure'
  const yName = measureLabel.toLowerCase().includes('count') ? 'Record Count' : 'Value'
  const xName = groupingLabel || 'Grouping'

  if (form.chartKind === 'pie' || form.chartKind === 'donut') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 2, itemHeight: 8, textStyle: { fontSize: 10 } },
      series: [
        {
          type: 'pie',
          radius: form.chartKind === 'donut' ? ['38%', '58%'] : '55%',
          center: ['50%', '42%'],
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: PREVIEW_COLORS[i % PREVIEW_COLORS.length] },
          })),
        },
      ],
    }
  }

  const chartType =
    form.chartKind === 'area' || form.chartKind === 'line' ? 'line' : 'bar'

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 12, top: 22, bottom: 32 },
    xAxis: {
      type: 'category',
      name: xName,
      nameLocation: 'middle',
      nameGap: 22,
      data: categories,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: yName,
      nameTextStyle: { fontSize: 11 },
      axisLabel: { fontSize: 11 },
      minInterval: 1,
    },
    series: [
      {
        type: chartType,
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: PREVIEW_COLORS[i % PREVIEW_COLORS.length] },
        })),
        barMaxWidth: 36,
        smooth: form.chartKind === 'line' || form.chartKind === 'area',
        areaStyle: form.chartKind === 'area' ? { opacity: 0.12 } : undefined,
      },
    ],
  }
}

export const QUICK_CHART_TYPE_OPTIONS: { value: QuickChartFormState['chartKind']; label: string }[] =
  [
    { value: 'bar', label: 'Column chart' },
    { value: 'line', label: 'Line chart' },
    { value: 'area', label: 'Area chart' },
    { value: 'pie', label: 'Pie chart' },
    { value: 'donut', label: 'Donut chart' },
  ]

export const QUICK_CHART_DASHBOARDS = [
  { value: '', label: 'Select Dashboard' },
  { value: 'current', label: 'Current Dashboard' },
  { value: 'managers-home', label: "Manager's Home" },
] as const
