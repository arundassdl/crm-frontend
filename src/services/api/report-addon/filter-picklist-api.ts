import {
  getComponentPicklist,
  getComponentStageProbability,
  type ComponentPicklistOption as CrmPicklistRow,
  type StageProbabilityOption,
} from '@/services/api/general_apis/component-picklist-api'

export type FilterPicklistOption = {
  value: string
  label: string
}

function normalizePicklistRows(rows: CrmPicklistRow[] | StageProbabilityOption[]): FilterPicklistOption[] {
  const out: FilterPicklistOption[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const value = String(
      'option_id' in row && row.option_id
        ? row.option_id
        : row.value ?? ''
    ).trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    const label = String(row.label ?? value).trim() || value
    out.push({ value, label })
  }
  return out
}

export async function fetchComponentPicklistOptions(
  token: string,
  params: { module: string; layoutName: string; fieldName: string }
): Promise<FilterPicklistOption[]> {
  const rows = await getComponentPicklist(
    params.module,
    params.layoutName,
    params.fieldName,
    token
  )
  return normalizePicklistRows(rows)
}

export async function fetchStageProbabilityOptions(
  token: string,
  params: { module: string; layoutName: string; fieldName: string }
): Promise<FilterPicklistOption[]> {
  const rows = await getComponentStageProbability(
    params.module,
    params.layoutName,
    params.fieldName,
    token
  )
  return normalizePicklistRows(rows)
}
