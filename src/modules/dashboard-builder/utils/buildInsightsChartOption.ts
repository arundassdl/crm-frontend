import type { EChartsOption } from 'echarts'

import type { ChartKind, WidgetProperties } from '../types'
import {
  extractChartSeriesFromGrid,
  type ParsedReportGrid,
} from './parse-insights-query-result'

const DEFAULT_CHART_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

function buildStaticFallback(kind: ChartKind | undefined, title: string, properties?: WidgetProperties): EChartsOption {
  const chartKind = kind?.toLowerCase()
  const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const values = [42, 58, 65, 48, 72, 84]
  const colors = properties?.colors ?? DEFAULT_CHART_COLORS

  if (chartKind === 'pie' || chartKind === 'donut') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      series: [
        {
          type: 'pie',
          radius: chartKind === 'donut' ? ['45%', '70%'] : '65%',
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: colors[i % colors.length] }
          })),
        },
      ],
    }
  }

  const chartType = chartKind === 'area' ? 'line' : chartKind === 'bar' ? 'bar' : chartKind === 'scatter' ? 'scatter' : 'line'
  return {
    title: { text: title, show: false },
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 10 },
      name: properties?.xAxis
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 },
      name: properties?.yAxis
    },
    series: [
      {
        type: chartType,
        data: values,
        smooth: kind === 'line' || kind === 'area',
        areaStyle: kind === 'area' ? { opacity: 0.15 } : undefined,
        itemStyle: { color: colors[0] },
      },
    ],
  }
}

/** Builds an ECharts option from parsed insights query result rows. */
export function buildInsightsChartOption(
  kind: ChartKind | undefined,
  parsed: ParsedReportGrid | null,
  title: string,
  properties?: WidgetProperties
): EChartsOption {
  const series = parsed ? extractChartSeriesFromGrid(parsed) : null
  if (!series) {
    return buildStaticFallback(kind, title, properties)
  }

  const { categories, values, categoryLabel, valueLabel } = series
  const chartKind = kind?.toLowerCase() ?? 'bar'
  const colors = properties?.colors ?? DEFAULT_CHART_COLORS

  if (chartKind === 'pie' || chartKind === 'donut') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      series: [
        {
          type: 'pie',
          radius: chartKind === 'donut' ? ['45%', '70%'] : '65%',
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    }
  }

  if (chartKind === 'funnel') {
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'funnel',
          left: '10%',
          width: '80%',
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    }
  }

  const chartType =
    chartKind === 'area' || chartKind === 'line' ? 'line' : chartKind === 'scatter' ? 'scatter' : 'bar'

  return {
    title: { text: title, show: false },
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 16, bottom: 36 },
    xAxis: {
      type: 'category',
      name: properties?.xAxis ?? categoryLabel,
      nameLocation: 'middle',
      nameGap: 24,
      data: categories,
      axisLabel: { fontSize: 10, rotate: categories.length > 6 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      name: properties?.yAxis ?? valueLabel,
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 10 },
      minInterval: 1,
    },
    series: [
      {
        type: chartType,
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: colors[i % colors.length] },
        })),
        barMaxWidth: 48,
        smooth: chartKind === 'line' || chartKind === 'area',
        areaStyle: chartKind === 'area' ? { opacity: 0.12 } : undefined,
      },
    ],
  }
}
