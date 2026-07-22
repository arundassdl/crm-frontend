/**
 * Soft-pastel fills for KPI/count card bodies (mirrors the reference KPI_FILL palette).
 * The reference keys these per component id; here we pick deterministically from the widget's
 * own catalog id / title so each card keeps a stable, varied tint. UI only — no data logic.
 */
const KPI_FILLS: { fill: string; accent: string }[] = [
  { fill: '#D6E4F9', accent: '#2F6FED' },
  { fill: '#D0E5E0', accent: '#2E9E7B' },
  { fill: '#FAE3D0', accent: '#E0883F' },
  { fill: '#F5D9E1', accent: '#DB5E8C' },
]

export function kpiFill(key: string | undefined | null): { fill: string; accent: string } {
  const k = String(key ?? '')
  if (!k) return KPI_FILLS[0]
  let h = 0
  for (let i = 0; i < k.length; i += 1) {
    h = (h * 31 + k.charCodeAt(i)) >>> 0
  }
  return KPI_FILLS[h % KPI_FILLS.length]
}

/** Body background for a KPI card (reference uses `fill + "40"` in light, near-black in dark). */
export function kpiBodyBackground(key: string | undefined | null, isDark: boolean): string {
  if (isDark) return '#111111'
  return `${kpiFill(key).fill}40`
}
