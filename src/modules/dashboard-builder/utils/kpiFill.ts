export type KpiPaletteEntry = { fill: string; accent: string }

/**
 * Soft-pastel fills for KPI/count card bodies, in the reference's own order — a row of count
 * cards walks blue → green → orange → pink. UI only, no data logic.
 */
const KPI_FILLS: KpiPaletteEntry[] = [
  { fill: '#D6E4F9', accent: '#2F6FED' },
  { fill: '#D0E5E0', accent: '#2E9E7B' },
  { fill: '#FAE3D0', accent: '#E0883F' },
  { fill: '#F5D9E1', accent: '#DB5E8C' },
]

/**
 * Colour for a card at a known position in the row — the reference's own assignment, and the
 * only way neighbouring cards are guaranteed not to share a tint.
 */
export function kpiFillAt(index: number): KpiPaletteEntry {
  const i = Math.trunc(index)
  return KPI_FILLS[((i % KPI_FILLS.length) + KPI_FILLS.length) % KPI_FILLS.length]
}

/**
 * Colour for a card whose position is unknown: hashed from its own key so the tint is at
 * least stable per widget. Two widgets can hash to the same entry — prefer {@link kpiFillAt}
 * wherever the position is available.
 */
export function kpiFill(key: string | undefined | null): KpiPaletteEntry {
  const k = String(key ?? '')
  if (!k) return KPI_FILLS[0]
  let h = 0
  for (let i = 0; i < k.length; i += 1) {
    h = (h * 31 + k.charCodeAt(i)) >>> 0
  }
  return KPI_FILLS[h % KPI_FILLS.length]
}

/** Palette entry by position when there is one, else hashed from `key`. */
export function kpiPaletteEntry(
  key: string | undefined | null,
  index?: number | null
): KpiPaletteEntry {
  return index == null ? kpiFill(key) : kpiFillAt(index)
}

/**
 * Body background for a KPI card (near-black in dark mode).
 *
 * `tint` is the faint wash the basic KPI/number widgets use over the card's glass surface;
 * `solid` is the full pastel the reference count cards are painted in, where the tint would
 * be washed out to near-white by the translucent card behind it.
 */
export function kpiBodyBackground(
  key: string | undefined | null,
  isDark: boolean,
  strength: 'tint' | 'solid' = 'tint',
  index?: number | null
): string {
  if (isDark) return '#111111'
  const { fill } = kpiPaletteEntry(key, index)
  return strength === 'solid' ? fill : `${fill}40`
}
