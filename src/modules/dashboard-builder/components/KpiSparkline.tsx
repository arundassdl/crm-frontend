'use client'

import { memo, useId } from 'react'

type KpiSparklineProps = {
  /** Real values, oldest → newest. */
  points: number[]
  /** Line colour; the fill is the same colour faded out. */
  accent: string
  width?: number
  height?: number
  /** Description for assistive tech / hover, e.g. "Last 12 periods". */
  title?: string
}

/**
 * Minimal area sparkline for the count cards — inline SVG, no chart library, so it adds
 * nothing to the bundle and scales with the card.
 *
 * Purely a rendering of the numbers it is handed: it never pads, smooths or extrapolates,
 * so a two-point series simply draws as one segment.
 */
function KpiSparklineInner({ points, accent, width = 88, height = 40, title }: KpiSparklineProps) {
  // Must be called before any early return — a hook skipped on one render and called on the
  // next changes the hook order.
  const gradientId = useId()

  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  // A flat series would divide by zero; draw it as a centred straight line instead.
  const span = max - min || 1
  const stepX = width / (points.length - 1)
  // Inset vertically so the stroke isn't clipped at the extremes.
  const pad = 4
  const usable = height - pad * 2

  const coords = points.map((value, i) => {
    const x = i * stepX
    const y = pad + (1 - (value - min) / span) * usable
    return [x, max === min ? pad + usable / 2 : y] as const
  })

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="flex-shrink-0 overflow-visible"
      role="img"
      aria-label={title ?? 'Trend'}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const KpiSparkline = memo(KpiSparklineInner)
