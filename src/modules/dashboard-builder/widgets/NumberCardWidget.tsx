'use client'

import { memo } from 'react'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { KpiCardWidget } from './KpiCardWidget'

type NumberCardWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
  paletteIndex?: number
  showBodyTitle?: boolean
}

/** Number cards are single-metric count cards — same reference card as the KPI counts. */
function NumberCardWidgetInner(props: NumberCardWidgetProps) {
  return <KpiCardWidget {...props} />
}

export const NumberCardWidget = memo(NumberCardWidgetInner)
