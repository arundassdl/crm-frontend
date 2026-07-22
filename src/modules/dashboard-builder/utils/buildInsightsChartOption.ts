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

  if (chartKind === 'progress') {
    const maxVal = Math.max(...values, 1)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 80, right: 50, top: 16, bottom: 16 },
      xAxis: {
        type: 'value',
        max: maxVal,
        axisLabel: { fontSize: 10, formatter: (v: number) => `${Math.round((v / maxVal) * 100)}%` },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i % colors.length], borderRadius: [0, 4, 4, 0] },
          })),
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            formatter: `{c}%`,
          },
          showBackground: true,
          backgroundStyle: { color: 'rgba(180,180,180,0.15)', borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }

  if (chartKind === 'scatter') {
    return {
      title: { text: title, show: false },
      tooltip: { trigger: 'item' },
      grid: { left: 48, right: 16, top: 16, bottom: 36 },
      xAxis: {
        type: 'value',
        name: properties?.xAxis,
        nameLocation: 'middle' as const,
        nameGap: 24,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: properties?.yAxis,
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'scatter',
          data: categories.map((_, i) => [i, values[i] ?? 0]),
          symbolSize: 12,
          itemStyle: { color: colors[0] },
        },
      ],
    }
  }

  const isLine = chartKind === 'area' || chartKind === 'line' || chartKind === 'live'
  const chartType = isLine ? 'line' : 'bar'
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
        smooth: isLine,
        areaStyle: chartKind === 'area' || chartKind === 'live' ? { opacity: 0.15 } : undefined,
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
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F172A',
        borderWidth: 0,
        padding: [6, 10],
        textStyle: { color: '#FFFFFF', fontSize: 11 },
        extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,0.25);',
        formatter: (params: unknown) => {
          const p = params as { name?: string; value?: number }
          return `<div style="font-size:11px;color:#CBD5E1;margin-bottom:2px;">${p?.name ?? ''}</div><div style="font-size:13px;font-weight:700;color:#fff;">${p?.value ?? ''}</div>`
        },
      },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 14,
        textStyle: { fontSize: 11, color: '#64748B' },
      },
      series: [
        {
          type: 'pie',
          radius: chartKind === 'donut' ? ['48%', '72%'] : ['0%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: colors[i % colors.length], borderRadius: 4 },
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

  if (chartKind === 'treemap') {
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'treemap',
          roam: false,
          breadcrumb: { show: false },
          data: categories.map((name, i) => ({
            name,
            value: values[i] ?? 0,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    }
  }

  if (chartKind === 'butterfly') {
    const leftValues = values.map(v => -v)
    const rightValues = values.map((v, i) => values[(i + 1) % values.length] ?? v)
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as { value: number; seriesName?: string }[]
          return items.map(p => `${p.seriesName ?? ''}: ${Math.abs(p.value)}`).join('<br/>')
        },
      },
      grid: { left: 48, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: (v: number) => String(Math.abs(v)) } },
      yAxis: { type: 'category', data: categories, axisLabel: { fontSize: 10 } },
      series: [
        { name: 'Group A', type: 'bar', stack: 'butterfly', data: leftValues, itemStyle: { color: colors[0] }, barMaxWidth: 28 },
        { name: 'Group B', type: 'bar', stack: 'butterfly', data: rightValues, itemStyle: { color: colors[1 % colors.length] }, barMaxWidth: 28 },
      ],
    }
  }

  // Horizontal bar chart (axes swapped relative to column) — styled to match the reference:
  // clean gray category labels, hidden value axis, thin rounded bars, value labels at the bar
  // ends, a dark rounded tooltip and a subtle hover band.
  if (chartKind === 'bar') {
    return {
      title: { text: title, show: false },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148,163,184,0.12)' } },
        backgroundColor: '#0F172A',
        borderWidth: 0,
        padding: [6, 10],
        textStyle: { color: '#FFFFFF', fontSize: 11 },
        extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,0.25);',
        formatter: (params: unknown) => {
          const arr = params as { name?: string; value?: number }[]
          const p = Array.isArray(arr) ? arr[0] : (params as { name?: string; value?: number })
          if (!p) return ''
          return `<div style="font-size:11px;color:#CBD5E1;margin-bottom:2px;">${p.name ?? ''}</div><div style="font-size:13px;font-weight:700;color:#fff;">${p.value ?? ''}</div>`
        },
      },
      grid: { left: 8, right: 28, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        show: false,
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 11, color: '#64748B', fontWeight: 500 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i % colors.length], borderRadius: [0, 6, 6, 0] },
          })),
          barMaxWidth: 12,
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: '#94A3B8',
            fontWeight: 600,
            formatter: '{c}',
          },
        },
      ],
    }
  }

  if (chartKind === 'progress') {
    const maxVal = Math.max(...values, 1)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 80, right: 50, top: 16, bottom: 16 },
      xAxis: {
        type: 'value',
        max: maxVal,
        axisLabel: { fontSize: 10, formatter: (v: number) => `${Math.round((v / maxVal) * 100)}%` },
      },
      yAxis: {
        type: 'category',
        name: properties?.xAxis ?? categoryLabel,
        data: categories,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i % colors.length], borderRadius: [0, 4, 4, 0] },
          })),
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            formatter: `{c}%`,
          },
          showBackground: true,
          backgroundStyle: { color: 'rgba(180,180,180,0.15)', borderRadius: [0, 4, 4, 0] },
        },
      ],
    }
  }

  if (chartKind === 'scatter') {
    return {
      title: { text: title, show: false },
      tooltip: { trigger: 'item' },
      grid: { left: 48, right: 16, top: 16, bottom: 36 },
      xAxis: {
        type: 'value',
        name: properties?.xAxis ?? categoryLabel,
        nameLocation: 'middle' as const,
        nameGap: 24,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: properties?.yAxis ?? valueLabel,
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'scatter',
          data: categories.map((_, i) => [i, values[i] ?? 0]),
          symbolSize: 12,
          itemStyle: { color: colors[0] },
        },
      ],
    }
  }

  const isLine = chartKind === 'area' || chartKind === 'line' || chartKind === 'live'

  const darkTooltip = {
    trigger: 'axis' as const,
    axisPointer: { type: 'shadow' as const, shadowStyle: { color: 'rgba(148,163,184,0.12)' } },
    backgroundColor: '#0F172A',
    borderWidth: 0,
    padding: [6, 10] as [number, number],
    textStyle: { color: '#FFFFFF', fontSize: 11 },
    extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,0.25);',
    formatter: (params: unknown) => {
      const arr = params as { name?: string; value?: number }[]
      const p = Array.isArray(arr) ? arr[0] : (params as { name?: string; value?: number })
      if (!p) return ''
      return `<div style="font-size:11px;color:#CBD5E1;margin-bottom:2px;">${p.name ?? ''}</div><div style="font-size:13px;font-weight:700;color:#fff;">${p.value ?? ''}</div>`
    },
  }

  // Line / area — clean gray x labels, hidden value axis with a dashed horizontal grid.
  if (isLine) {
    const accent = colors[0]
    return {
      title: { text: title, show: false },
      tooltip: darkTooltip,
      grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: chartKind !== 'line',
        axisLabel: { fontSize: 10, color: '#94A3B8', rotate: categories.length > 8 ? 30 : 0 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { type: 'dashed', color: '#F0F2F5' } },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent },
          areaStyle: chartKind === 'area' || chartKind === 'live' ? { color: accent, opacity: 0.1 } : undefined,
        },
      ],
    }
  }

  // Column (vertical bar) — rounded top bars, clean gray x labels, hidden value axis.
  return {
    title: { text: title, show: false },
    tooltip: darkTooltip,
    grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 10, color: '#94A3B8', rotate: categories.length > 8 ? 30 : 0 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: colors[i % colors.length], borderRadius: [4, 4, 0, 0] },
        })),
        barMaxWidth: 36,
      },
    ],
  }
}
