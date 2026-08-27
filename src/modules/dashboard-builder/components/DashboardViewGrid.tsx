'use client'

import { memo, useMemo, type RefObject } from 'react'
import { Box, Typography } from '@mui/material'
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'

import '../styles/dashboard-builder.css'

import type { DashboardWidget, GridLayoutItem } from '../types'
import {
  GRID_BREAKPOINTS,
  GRID_COLS,
  generateViewResponsiveLayouts,
} from '../utils/layoutHelpers'
import { buildKpiPaletteIndex } from '../utils/kpiPaletteIndex'
import { WidgetCard } from './WidgetCard'

type DashboardViewGridProps = {
  widgets: DashboardWidget[]
  layout: GridLayoutItem[]
}

function DashboardViewGridInner({ widgets, layout }: DashboardViewGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })
  const gridContainerRef = containerRef as RefObject<HTMLDivElement>
  const widgetMap = useMemo(() => new Map(widgets.map(w => [String(w.id), w])), [widgets])
  const kpiPaletteIndex = useMemo(() => buildKpiPaletteIndex(widgets), [widgets])
  const responsiveLayouts = useMemo(
    () => generateViewResponsiveLayouts(layout, widgets),
    [layout, widgets]
  )

  if (widgets.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          minHeight: 280,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 3,
          py: 6,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={600} color="text.primary">
          No widgets on this dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 420 }}>
          This dashboard does not have any widgets yet.
        </Typography>
      </Box>
    )
  }

  return (
    <div
      ref={gridContainerRef}
      className="dashboard-builder-grid dashboard-view-grid min-h-[320px] w-full max-w-full"
    >
      {mounted ? (
        <ResponsiveGridLayout
          className="layout w-full"
          width={width}
          layouts={responsiveLayouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={48}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          compactor={verticalCompactor}
          dragConfig={{ enabled: false }}
          resizeConfig={{ enabled: false }}
        >
          {responsiveLayouts.lg.map(item => {
            const widget = widgetMap.get(String(item.i))
            if (!widget) return null

            return (
              <div key={item.i} data-grid={item} className="relative h-full">
                <WidgetCard
                  widget={widget}
                  paletteIndex={kpiPaletteIndex.get(widget.id)}
                  readOnly
                />
              </div>
            )
          })}
        </ResponsiveGridLayout>
      ) : (
        <div className="min-h-[240px] animate-pulse rounded-xl bg-slate-100" />
      )}
    </div>
  )
}

export const DashboardViewGrid = memo(DashboardViewGridInner)
