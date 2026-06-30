'use client'

import dynamic from 'next/dynamic'
import { memo, useMemo } from 'react'
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material'

import type { ChartKind } from '../types'
import {
  buildChartPreviewOption,
  QUICK_CHART_TYPE_OPTIONS,
} from '../utils/quickChartPreview'

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 168,
        color: 'text.secondary',
        fontSize: '0.75rem',
      }}
    >
      Loading preview…
    </Box>
  ),
})

const PROGRESS_PREVIEW_DATA = [
  { label: 'Group A', percent: 30, color: '#f59e0b' },
  { label: 'Group B', percent: 60, color: '#3b82f6' },
  { label: 'Group C', percent: 85, color: '#10b981' },
]

function ProgressPreview() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.5, height: 168, px: 1.5, py: 1 }}>
      {PROGRESS_PREVIEW_DATA.map((row, i) => (
        <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
            <span style={{ color: '#475569', fontWeight: 500 }}>{row.label}</span>
            <span style={{ color: '#94a3b8' }}>{row.percent}%</span>
          </Box>
          <Box sx={{ height: 8, width: '100%', borderRadius: 4, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${row.percent}%`, borderRadius: 4, bgcolor: row.color, transition: 'width 0.5s' }} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

type ChartPreviewPanelProps = {
  chartKind: ChartKind
  onChartKindChange: (kind: ChartKind) => void
  measureLabel?: string
  groupingLabel?: string
  /** Hide the chart-type dropdown when the chart kind is driven externally (e.g. the unified Add Component screen's type cards). */
  hideSelector?: boolean
}

/**
 * Shared chart-type selector + live preview used by both the "Add Chart
 * Component" and "Add Chart from Report" dialogs so chart-type switching
 * behaves identically in both. The ECharts instance is keyed on the chart
 * kind so it fully re-mounts on every change — this guarantees the preview
 * never retains stale series/axes when switching between coordinate systems
 * (e.g. column → pie → treemap).
 */
function ChartPreviewPanelInner({
  chartKind,
  onChartKindChange,
  measureLabel,
  groupingLabel,
  hideSelector,
}: ChartPreviewPanelProps) {
  const previewConfig = useMemo(
    () => buildChartPreviewOption(chartKind, { measureLabel, groupingLabel }),
    [chartKind, measureLabel, groupingLabel]
  )

  return (
    <Box
      sx={{
        flex: { lg: '0 0 35%' },
        width: { lg: '35%' },
        minWidth: { lg: 300 },
        maxWidth: { lg: 440 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 2.5,
        minHeight: { xs: 220 },
        bgcolor: 'action.hover',
        position: { lg: 'sticky' },
        top: { lg: 0 },
        alignSelf: { lg: 'flex-start' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary' }}
        >
          Preview
        </Typography>
        {!hideSelector && (
          <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'background.paper' }}>
            <Select
              value={chartKind}
              onChange={e => onChartKindChange(e.target.value as ChartKind)}
              renderValue={selected => {
                const opt = QUICK_CHART_TYPE_OPTIONS.find(o => o.value === selected)
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className="ri-bar-chart-grouped-line text-base" aria-hidden />
                    {opt?.label ?? 'Column Chart'}
                  </Box>
                )
              }}
            >
              {QUICK_CHART_TYPE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Box
        sx={{
          minHeight: 200,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          p: 1.5,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {chartKind === 'progress' ? (
          <ProgressPreview />
        ) : (
          <ReactECharts
            key={chartKind}
            option={previewConfig}
            style={{ height: 168, width: '100%' }}
            notMerge
            lazyUpdate
          />
        )}
      </Box>
    </Box>
  )
}

export const ChartPreviewPanel = memo(ChartPreviewPanelInner)
