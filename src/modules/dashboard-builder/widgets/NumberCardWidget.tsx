'use client'

import { memo } from 'react'

import type { DashboardWidget } from '../types'
import { KpiWidget } from './KpiWidget'

type NumberCardWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
}

/** Number cards reuse KPI styling with emphasis on single metric. */
function NumberCardWidgetInner(props: NumberCardWidgetProps) {
  return <KpiWidget {...props} />
}

export const NumberCardWidget = memo(NumberCardWidgetInner)
