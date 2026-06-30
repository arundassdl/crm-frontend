'use client'

import { memo } from 'react'
import { Box, Typography } from '@mui/material'

type PreviewStage = {
  label: string
  count: number
  won: number
  lost: number
}

const SAMPLE_STAGES: PreviewStage[] = [
  { label: 'Qualification', count: 2, won: 0, lost: 0 },
  { label: 'Needs Analysis', count: 1, won: 1, lost: 0 },
  { label: 'Test', count: 1, won: 0, lost: 1 },
  { label: 'Value Proposition', count: 1, won: 0, lost: 0 },
]

const BAR_COLOR = '#F6C667'
const CONVERSION_COLOR = '#2D7FF9'
const WON_COLOR = '#4CAF50'
const LOST_COLOR = '#F44336'

function fmt(value: number): string {
  return value.toLocaleString()
}

export type StaircasePreviewProps = {
  title?: string
}

function StaircasePreviewInner({ title }: StaircasePreviewProps) {
  const maxCount = Math.max(...SAMPLE_STAGES.map(s => s.count))
  const firstCount = SAMPLE_STAGES[0]?.count ?? 0
  const totalWon = SAMPLE_STAGES.reduce((s, r) => s + r.won, 0)
  const totalLost = SAMPLE_STAGES.reduce((s, r) => s + r.lost, 0)
  const winRate = firstCount > 0 ? Math.round((totalWon / firstCount) * 1000) / 10 : 0

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        p: 2,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
        {title?.trim() || 'Standard Staircase'}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        Sample data — preview only
      </Typography>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Left: Staircase bars */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {SAMPLE_STAGES.map((stage, idx) => {
            const isLast = idx === SAMPLE_STAGES.length - 1
            const widthPct = Math.max(15, (stage.count / (maxCount || 1)) * 100)
            const next = !isLast ? SAMPLE_STAGES[idx + 1] : null
            const nextCount = next?.count ?? 0
            const conversion =
              stage.count > 0 && !isLast
                ? Math.round((nextCount / stage.count) * 1000) / 10
                : 0
            const hasWon = !isLast && stage.won > 0
            const hasLost = !isLast && stage.lost > 0

            return (
              <Box key={stage.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                  <Typography
                    noWrap
                    sx={{
                      width: 60,
                      minWidth: 60,
                      flexShrink: 0,
                      fontSize: '0.4375rem',
                      fontWeight: 500,
                      color: '#334155',
                      textAlign: 'right',
                    }}
                  >
                    {stage.label}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: `${widthPct}%`,
                        minWidth: 24,
                        height: 16,
                        bgcolor: BAR_COLOR,
                        borderRadius: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.4375rem', fontWeight: 700, color: '#1e293b' }}>
                        {fmt(stage.count)}
                      </Typography>
                    </Box>
                  </Box>
                  {(hasWon || hasLost) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.4375rem', color: CONVERSION_COLOR }}>→</Typography>
                      {hasWon && (
                        <Box sx={{ height: 16, minWidth: 18, px: 0.25, bgcolor: WON_COLOR, borderRadius: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography sx={{ fontSize: '0.4375rem', fontWeight: 700, color: '#fff' }}>{stage.won}</Typography>
                        </Box>
                      )}
                      {hasLost && (
                        <Box sx={{ height: 16, minWidth: 18, px: 0.25, bgcolor: LOST_COLOR, borderRadius: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography sx={{ fontSize: '0.4375rem', fontWeight: 700, color: '#fff' }}>{stage.lost}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.125, pl: '60px' }}>
                  <Typography sx={{ fontSize: '0.375rem', fontWeight: 600, color: CONVERSION_COLOR }}>
                    {fmt(isLast ? 0 : nextCount)} ({isLast ? 0 : conversion}%) ↓
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>

        {/* Right: Summary */}
        <Box
          sx={{
            width: 65,
            minWidth: 65,
            flexShrink: 0,
            borderLeft: '1px dashed',
            borderColor: '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pl: 0.75,
          }}
        >
          <Typography sx={{ fontSize: '0.375rem', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
            {SAMPLE_STAGES[0].label}
          </Typography>
          <Box sx={{ width: 1, height: 8, bgcolor: '#cbd5e1', my: 0.25 }} />
          <Typography sx={{ fontSize: '0.3125rem', color: '#64748b', textAlign: 'center' }}>
            Win rate
          </Typography>
          <Typography sx={{ fontSize: '0.4375rem', fontWeight: 700, color: WON_COLOR, textAlign: 'center' }}>
            {fmt(totalWon)} ({winRate}%)
          </Typography>
          <Box sx={{ width: 1, height: 8, bgcolor: '#cbd5e1', my: 0.25 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.25 }}>
            <Box sx={{ height: 10, minWidth: 14, px: 0.25, bgcolor: WON_COLOR, borderRadius: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.3125rem', fontWeight: 700, color: '#fff' }}>{fmt(totalWon)}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.3125rem', fontWeight: 600, color: '#334155' }}>Won</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Box sx={{ height: 10, minWidth: 14, px: 0.25, bgcolor: LOST_COLOR, borderRadius: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.3125rem', fontWeight: 700, color: '#fff' }}>{fmt(totalLost)}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.3125rem', fontWeight: 600, color: '#334155' }}>Lost</Typography>
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mt: 1.5,
          pt: 1,
          borderTop: 1,
          borderColor: 'divider',
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: '0.5625rem', color: '#475569' }}>{label}</Typography>
    </Box>
  )
}

export const StaircasePreview = memo(StaircasePreviewInner)
