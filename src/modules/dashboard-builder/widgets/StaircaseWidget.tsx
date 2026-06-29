'use client'

import { memo, useMemo } from 'react'
import { Box, Typography } from '@mui/material'

import type { DashboardWidget } from '../types'
import type { RuntimeFilterRow } from '../types/componentFilters'
import { useInsightsQueryResult } from '../hooks/useInsightsQueryResult'
import { resolveWidgetQueryName } from '../utils/resolveWidgetQueryName'
import { extractStaircaseData, type StaircaseStageData } from '../utils/extractStaircaseData'

const BAR_COLOR = '#F6C667'
const CONVERSION_COLOR = '#2D7FF9'
const WON_COLOR = '#4CAF50'
const LOST_COLOR = '#F44336'

function formatCount(value: number): string {
  return value.toLocaleString()
}

function WonLostBoxes({ stage }: { stage: StaircaseStageData }) {
  if (stage.isLast) return null
  const hasWon = stage.won > 0
  const hasLost = stage.lost > 0
  if (!hasWon && !hasLost) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      <Typography sx={{ fontSize: '1rem', color: CONVERSION_COLOR, lineHeight: 1 }}>→</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {hasWon && (
          <Box
            sx={{
              height: 36,
              minWidth: 44,
              px: 1,
              bgcolor: WON_COLOR,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>
              {formatCount(stage.won)}
            </Typography>
          </Box>
        )}
        {hasLost && (
          <Box
            sx={{
              height: 36,
              minWidth: 44,
              px: 1,
              bgcolor: LOST_COLOR,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>
              {formatCount(stage.lost)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

type StaircaseWidgetProps = {
  widget: DashboardWidget
  loading?: boolean
  runtimeFilters?: RuntimeFilterRow[]
}

function StaircaseWidgetInner({ widget, loading, runtimeFilters }: StaircaseWidgetProps) {
  const queryName = resolveWidgetQueryName(widget)

  const { parsed, isLoading: queryLoading, error } = useInsightsQueryResult({
    queryName,
    enabled: Boolean(queryName),
    runtimeFilters,
  })

  const data = useMemo(() => extractStaircaseData(parsed), [parsed])
  const showLoading = loading || (Boolean(queryName) && queryLoading)

  if (showLoading) {
    return (
      <div className="flex h-full gap-4 p-5">
        <div className="flex flex-1 flex-col justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div
                className="h-9 animate-pulse rounded bg-slate-100"
                style={{ width: `${100 - i * 20}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex w-36 flex-col items-center justify-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center">
        <span className="text-xs font-medium text-red-600">Failed to load staircase data</span>
        <span className="text-[11px] text-slate-500">
          {error instanceof Error ? error.message : 'Unknown error'}
        </span>
      </div>
    )
  }

  if (!data || !data.stages.length) {
    return (
      <div className="flex h-full items-center justify-center px-3">
        <span className="text-xs text-slate-400">No stage data available</span>
      </div>
    )
  }

  const { stages, totalWon, totalLost, overallWinRate, totalCount, firstStageLabel } = data

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Staircase bars */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 3,
            py: 2,
          }}
        >
          {stages.map((stage) => {
            const widthPct = Math.max(10, stage.width)

            return (
              <Box key={stage.stage}>
                {/* Stage row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  {/* Stage name */}
                  <Typography
                    noWrap
                    sx={{
                      width: 140,
                      minWidth: 140,
                      flexShrink: 0,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: '#334155',
                      textAlign: 'right',
                      pr: 0.5,
                    }}
                  >
                    {stage.stage}
                  </Typography>

                  {/* Bar with count centered inside */}
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: `${widthPct}%`,
                        minWidth: 48,
                        height: 36,
                        bgcolor: BAR_COLOR,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'width 0.3s ease',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                        {formatCount(stage.count)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Per-row Won/Lost boxes */}
                  <WonLostBoxes stage={stage} />
                </Box>

                {/* Conversion — always shown including "0 (0%)" for last stage */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 0.5,
                    pl: '140px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: CONVERSION_COLOR,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                    }}
                  >
                    {formatCount(stage.nextCount ?? 0)} ({stage.conversion ?? 0}%)
                    {' '}
                    <span style={{ fontSize: '0.75rem' }}>↓</span>
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>

        {/* Right: Vertical summary panel */}
        <Box
          sx={{
            width: 160,
            minWidth: 160,
            flexShrink: 0,
            borderLeft: '1px dashed',
            borderColor: '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            px: 1.5,
          }}
        >
          {/* First stage label */}
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              textAlign: 'center',
              mb: 0.5,
            }}
          >
            {firstStageLabel}
          </Typography>

          {/* Vertical connector */}
          <Box sx={{ width: 1, height: 24, bgcolor: '#cbd5e1', my: 0.5 }} />

          {/* Overall Win Rate */}
          <Typography
            sx={{
              fontSize: '0.625rem',
              fontWeight: 500,
              color: '#64748b',
              textAlign: 'center',
              mb: 0.25,
            }}
          >
            Overall win rate
          </Typography>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: WON_COLOR,
              textAlign: 'center',
            }}
          >
            {formatCount(totalWon)} ({overallWinRate ?? 0}%)
          </Typography>

          {/* Vertical connector */}
          <Box sx={{ width: 1, height: 24, bgcolor: '#cbd5e1', my: 0.5 }} />

          {/* Closed Won */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <Box
              sx={{
                height: 24,
                minWidth: 32,
                px: 0.75,
                bgcolor: WON_COLOR,
                borderRadius: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                {formatCount(totalWon)}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#334155' }}>
              Closed Won
            </Typography>
          </Box>

          {/* Closed Lost */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                height: 24,
                minWidth: 32,
                px: 0.75,
                bgcolor: LOST_COLOR,
                borderRadius: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                {formatCount(totalLost)}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#334155' }}>
              Closed Lost
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
          px: 3,
          py: 1.25,
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <LegendDot color={LOST_COLOR} label="Lost" />
        <LegendDot color={WON_COLOR} label="Won" />
        <LegendDot color={BAR_COLOR} label="Total Records" />
      </Box>
    </Box>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#475569' }}>
        {label}
      </Typography>
    </Box>
  )
}

export const StaircaseWidget = memo(StaircaseWidgetInner)
