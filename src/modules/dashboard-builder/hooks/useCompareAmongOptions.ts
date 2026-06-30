'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchReportFields } from '@/services/api/report-addon/report-fields-api'
import { fetchComponentPicklistOptions } from '@/services/api/report-addon/filter-picklist-api'
import { get_rolesname_list } from '@/services/api/roles/roles-api'
import { fetchCrmUsers } from '@/services/api/users/users-api'
import {
  readAccessTokenString,
  readRoleProfileFromStorage,
} from '@/utils/accessTokenDataStorage'

import { getFieldFilterCategory } from '../utils/report-filters/field-category'

export type CompareAmongOption = {
  value: string
  label: string
}

export const compareAmongOptionKeys = {
  users: ['comparator-compare-among-users'] as const,
  roles: ['comparator-compare-among-roles'] as const,
  picklistFields: (moduleValue: string) =>
    ['comparator-compare-among-picklist-fields', moduleValue] as const,
}

function readRowString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return ''
}

function sortByLabel(options: CompareAmongOption[]): CompareAmongOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
}

/** Users available for the "Custom Users" compare-among option. */
export function useCompareAmongUsers(enabled = true) {
  const token = readAccessTokenString()

  return useQuery({
    queryKey: compareAmongOptionKeys.users,
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const rows = await fetchCrmUsers(token)

      const out: CompareAmongOption[] = []
      const seen = new Set<string>()
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue
        const r = row as unknown as Record<string, unknown>
        const value = readRowString(r, 'name', 'user_id', 'email')
        if (!value || seen.has(value)) continue
        seen.add(value)
        const label = readRowString(r, 'full_name', 'name') || value
        out.push({ value, label })
      }
      return sortByLabel(out)
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60_000,
  })
}

/** Roles available for the "Roles" compare-among option. */
export function useCompareAmongRoles(enabled = true) {
  const token = readAccessTokenString()

  return useQuery({
    queryKey: compareAmongOptionKeys.roles,
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const rows = await get_rolesname_list(token)
      if (!Array.isArray(rows)) return []

      const out: CompareAmongOption[] = []
      const seen = new Set<string>()
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue
        const r = row as Record<string, unknown>
        const value = readRowString(r, 'rolekey', 'role_key', 'name')
        if (!value || seen.has(value)) continue
        seen.add(value)
        const label = readRowString(r, 'label', 'role_name', 'rolename') || value
        out.push({ value, label })
      }
      return sortByLabel(out)
    },
    enabled: enabled && Boolean(token),
    staleTime: 5 * 60_000,
  })
}

export type PicklistValueOption = { value: string; label: string }

/**
 * Picklist value options for a specific module + field.
 * Resolves layoutName + moduleName from the fields API, then fetches options via the picklist API.
 */
export function usePicklistValueOptions(
  moduleValue: string,
  moduleLabel: string,
  fieldName: string,
  enabled = true
) {
  const token = readAccessTokenString()
  const roleProfile = readRoleProfileFromStorage()

  return useQuery({
    queryKey: ['comparator-picklist-values', moduleValue, fieldName] as const,
    queryFn: async (): Promise<PicklistValueOption[]> => {
      if (!token) throw new Error('Not authenticated')
      const fields = await fetchReportFields(token, {
        module: moduleLabel || moduleValue,
        role_profile: roleProfile,
      })
      const layoutName = fields.layoutName
      const moduleName = fields.moduleName || moduleLabel || moduleValue
      if (!layoutName || !moduleName) return []
      return fetchComponentPicklistOptions(token, { module: moduleName, layoutName, fieldName })
    },
    enabled: enabled && Boolean(token) && Boolean(moduleValue) && Boolean(fieldName),
    staleTime: 60_000,
  })
}

/** Picklist (Select-type) fields for a module, used by the "Picklist Values" compare-among option. */
export function usePicklistFieldOptions(moduleValue: string, moduleLabel: string, enabled = true) {
  const token = readAccessTokenString()
  const roleProfile = readRoleProfileFromStorage()

  return useQuery({
    queryKey: compareAmongOptionKeys.picklistFields(moduleValue),
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const result = await fetchReportFields(token, {
        module: moduleLabel || moduleValue,
        role_profile: roleProfile,
      })

      const out: CompareAmongOption[] = []
      for (const entry of result.catalog) {
        if (getFieldFilterCategory(entry.fieldtype, entry.frontendFieldtype) !== 'select') continue
        out.push({ value: entry.fieldName, label: entry.label })
      }
      return out
    },
    enabled: enabled && Boolean(token) && Boolean(moduleValue),
    staleTime: 60_000,
  })
}
