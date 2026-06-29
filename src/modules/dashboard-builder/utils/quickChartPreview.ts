import type { EChartsOption } from 'echarts'

import type { ChartKind } from '../types'
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

/**
 * Shared live-preview option builder used by both the "Add Chart Component"
 * (Quick Chart) and "Add Chart from Report" dialogs. Keyed only on the chart
 * kind plus optional measure/grouping labels so the two dialogs render charts
 * identically.
 */
export function buildChartPreviewOption(
  kind: ChartKind,
  options?: {
    measureLabel?: string
    groupingLabel?: string
  }
): EChartsOption {
  const groupingLabel = options?.groupingLabel ?? ''
  const { categories, values } = previewCategories(groupingLabel)
  const measureLabel = options?.measureLabel ?? 'Measure'
  const yName = measureLabel.toLowerCase().includes('count') ? 'Record Count' : 'Value'
  const xName = groupingLabel || 'Grouping'

  const coloredData = values.map((v, i) => ({
    value: v,
    itemStyle: { color: PREVIEW_COLORS[i % PREVIEW_COLORS.length] },
  }))

  if (kind === 'pie' || kind === 'donut') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 2, itemHeight: 8, textStyle: { fontSize: 10 } },
      series: [
        {
          type: 'pie',
          radius: kind === 'donut' ? ['38%', '58%'] : '55%',
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

  if (kind === 'funnel') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 2, itemHeight: 8, textStyle: { fontSize: 10 } },
      series: [
        {
          type: 'funnel',
          left: '8%',
          width: '84%',
          top: 12,
          bottom: 28,
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: PREVIEW_COLORS[i % PREVIEW_COLORS.length] },
          })),
        },
      ],
    }
  }

  if (kind === 'treemap') {
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'treemap',
          roam: false,
          breadcrumb: { show: false },
          label: { fontSize: 11 },
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: PREVIEW_COLORS[i % PREVIEW_COLORS.length] },
          })),
        },
      ],
    }
  }

  // Butterfly chart: two opposing horizontal bar series sharing a category axis.
  if (kind === 'butterfly') {
    const leftValues = values.map(v => -v)
    const rightValues = values.map((v, i) => values[(i + 1) % values.length] ?? v)
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as { value: number; seriesName?: string }[]
          return items
            .map(p => `${p.seriesName ?? ''}: ${Math.abs(p.value)}`)
            .join('<br/>')
        },
      },
      grid: { left: 40, right: 12, top: 18, bottom: 24 },
      xAxis: {
        type: 'value',
        axisLabel: { fontSize: 11, formatter: (v: number) => String(Math.abs(v)) },
      },
      yAxis: { type: 'category', data: categories, axisLabel: { fontSize: 11 } },
      series: [
        {
          name: 'Group A',
          type: 'bar',
          stack: 'butterfly',
          data: leftValues,
          itemStyle: { color: PREVIEW_COLORS[0] },
          barMaxWidth: 20,
        },
        {
          name: 'Group B',
          type: 'bar',
          stack: 'butterfly',
          data: rightValues,
          itemStyle: { color: PREVIEW_COLORS[2] },
          barMaxWidth: 20,
        },
      ],
    }
  }

  if (kind === 'progress') {
    const progressData = categories.map((name, i) => ({
      name,
      value: [30, 60, 85][i % 3] ?? 60,
    }))
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 60, right: 50, top: 12, bottom: 18 },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { fontSize: 10, formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        data: progressData.map(d => d.name),
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: progressData.map((d, i) => ({
            value: d.value,
            itemStyle: { color: PREVIEW_COLORS[i % PREVIEW_COLORS.length], borderRadius: [0, 4, 4, 0] },
          })),
          barMaxWidth: 18,
          label: { show: true, position: 'right', fontSize: 10, formatter: '{c}%' },
          showBackground: true,
          backgroundStyle: { color: 'rgba(180,180,180,0.15)', borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }

  if (kind === 'scatter') {
    const scatterData = categories.map((_, i) => [
      values[i] ?? 2,
      [3, 5, 2, 4, 6][i % 5] ?? 3,
    ])
    return {
      tooltip: { trigger: 'item' },
      grid: { left: 40, right: 12, top: 22, bottom: 32 },
      xAxis: {
        type: 'value',
        name: xName,
        nameLocation: 'middle' as const,
        nameGap: 22,
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: yName,
        nameTextStyle: { fontSize: 11 },
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: 'scatter',
          data: scatterData,
          symbolSize: 14,
          itemStyle: { color: PREVIEW_COLORS[0] },
        },
      ],
    }
  }

  // Horizontal bar chart.
  if (kind === 'bar') {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 60, right: 12, top: 22, bottom: 28 },
      xAxis: {
        type: 'value',
        name: yName,
        nameTextStyle: { fontSize: 11 },
        axisLabel: { fontSize: 11 },
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        name: xName,
        data: categories,
        axisLabel: { fontSize: 11 },
      },
      series: [{ type: 'bar', data: coloredData, barMaxWidth: 28 }],
    }
  }

  // Live chart renders as a smooth line with an area fill to suggest streaming data.
  const isLine = kind === 'area' || kind === 'line' || kind === 'live'
  const chartType = isLine ? 'line' : 'bar'

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
        data: coloredData,
        barMaxWidth: 36,
        smooth: isLine,
        areaStyle: kind === 'area' || kind === 'live' ? { opacity: 0.12 } : undefined,
      },
    ],
  }
}

export const QUICK_CHART_TYPE_OPTIONS: { value: QuickChartFormState['chartKind']; label: string }[] =
  [
    { value: 'column', label: 'Column Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'donut', label: 'Donut Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'treemap', label: 'Treemap Chart' },
    { value: 'butterfly', label: 'Butterfly Chart' },
    { value: 'live', label: 'Live Chart' },
    { value: 'funnel', label: 'Funnel Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'progress', label: 'Progress Chart' },
    { value: 'scatter', label: 'Scatter Chart' },
  ]
