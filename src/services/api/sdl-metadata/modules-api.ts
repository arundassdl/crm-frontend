import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'
import { normalizeModuleListingRows } from '@/utils/normalizeModuleListingRows'

const METHOD = '/api/method/sdl_metadata.api.modules.get_modulelisting'

export type ModuleListingOption = {
  /** `main_doctype_name` — stored on form / report definition. */
  value: string
  /** `frontend_module` — shown in dropdown; used for `get_report_fields` / related APIs. */
  label: string
  /** SDL Module Map document name when present */
  name?: string
}

function readRowString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/**
 * Map `get_modulelisting` rows to dropdown options (same as reports-app).
 * - label: `frontend_module`
 * - value: `main_doctype_name`
 */
function mapModuleRowsToOptions(rows: unknown[]): ModuleListingOption[] {
  const out: ModuleListingOption[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const value =
      readRowString(
        r,
        'main_doctype_name',
        'main_doctype',
        'Main DocType Name',
        'doctype',
        'dt'
      ) || readRowString(r, 'name', 'Name')
    if (!value) continue
    const labelRaw = readRowString(
      r,
      'frontend_module',
      'frontend_mod',
      'Frontend Module',
      'module_label',
      'label'
    )
    const label = (labelRaw || value).trim()
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      value,
      label,
      name: r.name != null ? String(r.name) : undefined,
    })
  }

  return out.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  )
}

/** Module picklist for Quick Chart / layout builders (`get_modulelisting`). */
export async function fetchModuleListing(token: string): Promise<ModuleListingOption[]> {
  const url = `${CONSTANTS.API_BASE_URL}${METHOD}`
  const res = await axios.get(url, {
    headers: { Authorization: token },
    timeout: 30000,
  })
  const rows = normalizeModuleListingRows(res?.data?.message)
  return mapModuleRowsToOptions(rows)
}
