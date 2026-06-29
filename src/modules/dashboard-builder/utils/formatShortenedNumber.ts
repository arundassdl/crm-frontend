export type ShortenedNumberFormat = 'K' | 'M' | 'B'

const DIVISORS: Record<ShortenedNumberFormat, number> = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
}

/** Formats a number using the given shortened-number format (K/M/B) and decimal places. */
export function formatShortenedNumber(
  value: number,
  format: ShortenedNumberFormat,
  decimalPlaces: 0 | 1 | 2 = 0
): string {
  const divisor = DIVISORS[format]
  const scaled = value / divisor
  return `${scaled.toFixed(decimalPlaces)}${format}`
}
