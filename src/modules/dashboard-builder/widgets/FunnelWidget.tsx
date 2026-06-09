'use client'

import { memo, useMemo } from 'react'

import { ChartWidget } from './ChartWidget'
import type { DashboardWidget } from '../types'

type FunnelWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

function FunnelWidgetInner({ widget, loading }: FunnelWidgetProps) {
  const patched = useMemo(
    () => ({ ...widget, chartKind: 'funnel' as const }),
    [widget]
  )
  return <ChartWidget widget={patched} loading={loading} />
}

export const FunnelWidget = memo(FunnelWidgetInner)
