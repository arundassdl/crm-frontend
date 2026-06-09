import type { AggregateOption } from './buildAggregateOptions'
import type { GroupingOption } from './buildGroupingOptions'

/** Display measure label with module suffix in accent color (reference UI). */
export function getMeasureDisplayParts(option: AggregateOption): {
  title: string
  moduleLabel: string
} {
  const mod = option.moduleLabel.trim()
  let title = option.label.trim()
  if (mod && title.endsWith(mod)) {
    title = title.slice(0, -mod.length).replace(/\s*-\s*$/, '').trim()
  }
  return { title: title || option.label, moduleLabel: mod }
}

/** Grouping field disabled when the same module+field is already a measure. */
export function isGroupingDisabledByMeasures(
  grouping: GroupingOption,
  measureIds: string[],
  measureById: Map<string, AggregateOption>
): boolean {
  for (const mid of measureIds) {
    if (!mid) continue
    const measure = measureById.get(mid)
    if (!measure || measure.fieldname === '*') continue
    if (
      measure.module === grouping.moduleValue &&
      measure.fieldname.toLowerCase() === grouping.fieldName.toLowerCase()
    ) {
      return true
    }
  }
  return false
}

export function getFilledMeasureIds(measureIds: string[]): string[] {
  return measureIds.filter(id => Boolean(id?.trim()))
}
