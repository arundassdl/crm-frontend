export type ComparisonBasedOnOption = {
  value: string
  label: string
}

/** Naive plural → singular for module labels (e.g. "Leads" → "Lead", "Deals" → "Deal"). */
function toSingular(label: string): string {
  if (label.endsWith('ies')) return `${label.slice(0, -3)}y`
  if (label.endsWith('s')) return label.slice(0, -1)
  return label
}

function ownershipOptionsForModule(moduleLabel: string, valuePrefix: string): ComparisonBasedOnOption[] {
  const ownerLabel = `${toSingular(moduleLabel)} Owner`
  return [
    { value: `${valuePrefix}owner`, label: `${ownerLabel} - ${moduleLabel}` },
    { value: `${valuePrefix}created_by`, label: `Created By - ${moduleLabel}` },
    { value: `${valuePrefix}modified_by`, label: `Modified By - ${moduleLabel}` },
  ]
}

/**
 * "Comparison Based On" options for a Comparison Parameter.
 *
 * Always includes the primary (Metric) module's ownership fields, formatted as
 * "<Field Label> - <Module Name>" (e.g. "Lead Owner - Leads", "Created By - Leads").
 *
 * When a Related Module is selected, its ownership fields are appended too
 * (e.g. "Contact Owner - Contacts", "Created By - Contacts"), each prefixed
 * with `related_` so the values stay unique alongside the primary module's options.
 */
export function buildComparisonBasedOnOptions(
  primaryModuleLabel?: string,
  relatedModuleLabel?: string
): ComparisonBasedOnOption[] {
  const primary = ownershipOptionsForModule(primaryModuleLabel || 'Record', '')
  if (!relatedModuleLabel) return primary
  return [...primary, ...ownershipOptionsForModule(relatedModuleLabel, 'related_')]
}
