'use client'

export type ElegantScorecardMetricValue = {
  value: string
  trend?: 'up' | 'down'
  delta?: string
}

export type ElegantScorecardMetric = {
  label: string
  values: ElegantScorecardMetricValue[]
}

export type ElegantScorecardProps = {
  title?: string
  users: string[]
  metrics: ElegantScorecardMetric[]
  compact?: boolean
}

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-500',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-sky-100 text-sky-600',
  'bg-violet-100 text-violet-600',
]

const DEFAULT_SAMPLE_USERS = ['Jerome Edwards', 'Kinza Saleem', 'Liam Sanchez']
const DEFAULT_SAMPLE_METRICS = ['Leads Created', 'Revenue Generated', 'Deals Closed']

function sampleValue(seed: number): number {
  return 30 + ((seed * 37) % 70)
}

function formatSampleMetricValue(metricLabel: string, seed: number): string {
  const lower = metricLabel.toLowerCase()
  if (lower.includes('revenue') || lower.includes('amount')) {
    return `$${(sampleValue(seed) * 10000).toLocaleString()}`
  }
  if (lower.includes('rate') || lower.includes('conversion')) {
    return `${(sampleValue(seed) % 50) + 10}%`
  }
  return String(sampleValue(seed))
}

/** Builds deterministic sample comparison data for the Elegant scorecard preview. */
export function buildElegantSampleMetrics(
  users: string[] = DEFAULT_SAMPLE_USERS,
  metrics: string[] = DEFAULT_SAMPLE_METRICS
): ElegantScorecardMetric[] {
  return metrics.map((metric, metricIdx) => ({
    label: metric,
    values: users.map((_, userIdx) => {
      const seed = userIdx * 10 + metricIdx
      return {
        value: formatSampleMetricValue(metric, seed),
        trend: seed % 2 === 0 ? 'up' : 'down',
        delta: `${(seed % 20) + 1}%`,
      }
    }),
  }))
}

export const ELEGANT_SAMPLE_USERS = DEFAULT_SAMPLE_USERS
export const ELEGANT_SAMPLE_METRICS = DEFAULT_SAMPLE_METRICS

/**
 * Zoho-style "Sales Representative Scorecard" comparison table — users as columns,
 * metrics as rows, with avatar headers and growth indicators per cell.
 */
export function ElegantScorecard({ title, users, metrics, compact }: ElegantScorecardProps) {
  const avatarClass = compact ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-base'

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      {title && <p className="text-sm font-semibold text-slate-800">{title}</p>}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-28 sm:w-36" scope="col" />
              {users.map((user, idx) => (
                <th key={user} className="px-3 pb-2 text-center font-normal" scope="col">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`flex items-center justify-center rounded-full font-semibold ${avatarClass} ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                    >
                      {user.charAt(0)}
                    </span>
                    <span className="max-w-[88px] truncate text-xs font-medium text-slate-700">{user}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.map(metric => (
              <tr key={metric.label}>
                <th scope="row" className="py-2.5 pr-2 text-left text-xs font-medium text-slate-500">
                  {metric.label}
                </th>
                {metric.values.map((cell, idx) => (
                  <td key={idx} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                      {cell.value}
                      {cell.trend && (
                        <span
                          className={`inline-flex items-center text-[10px] font-medium ${
                            cell.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          <i
                            className={cell.trend === 'up' ? 'ri-arrow-up-s-fill' : 'ri-arrow-down-s-fill'}
                            aria-hidden
                          />
                          {cell.delta}
                        </span>
                      )}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
