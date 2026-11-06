'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Checkbox, CircularProgress, InputBase, TablePagination } from '@mui/material'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { getRolesListDatagrid } from '@/services/api/roles/roles-api'
import type { GridFilterModel, GridSortModel } from '@mui/x-data-grid'

const ROLE_DOCTYPE = 'SDL Role'

const colFields = [
  { doctype: ROLE_DOCTYPE, field: 'name', hidden: 'True' },
  { doctype: ROLE_DOCTYPE, field: 'role_name', hidden: 'False' },
  { doctype: ROLE_DOCTYPE, field: 'role_description', hidden: 'True' },
  { doctype: ROLE_DOCTYPE, field: 'disabled', hidden: 'False' },
  { doctype: ROLE_DOCTYPE, field: 'is_admin', hidden: 'False' },
  { doctype: ROLE_DOCTYPE, field: 'creation', hidden: 'False' },
  { doctype: ROLE_DOCTYPE, field: 'modified', hidden: 'False' },
]

const wherecondition = " AND `tabSDL Role`.role_name != 'Super Admin' "

function normalizeRoleKey(s: string | null | undefined): string {
  if (s == null) return ''
  const t = String(s).trim()
  if (!t) return ''
  try {
    return decodeURIComponent(t)
  } catch {
    return t
  }
}

function rowDetailKey(row: Record<string, unknown>): string {
  return String(row.name ?? row.role_name ?? '').trim()
}

type RolesSettingsListViewProps = {
  refreshKey: number
  onSelectRole: (key: string) => void
  settingsDetailKey?: string
}

export default function RolesSettingsListView({
  refreshKey,
  onSelectRole,
  settingsDetailKey = '',
}: RolesSettingsListViewProps) {
  const normalizedSelection = useMemo(
    () => normalizeRoleKey(settingsDetailKey),
    [settingsDetailKey]
  )

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<any[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [sortModel] = useState<GridSortModel>([])

  const didAutoSelectRef = useRef(false)
  const prevSelectionRef = useRef<string>('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }, [debouncedSearch])

  const fetchDataWrapper = useCallback((params: any) => getRolesListDatagrid(params), [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const filterModel: GridFilterModel = {
        items: [],
        quickFilterValues: debouncedSearch ? [debouncedSearch] : [],
      }
      const dataParams = {
        doctype: ROLE_DOCTYPE,
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        filters: filterModel,
        sort: sortModel,
      }
      try {
        const result: unknown = await fetchDataWrapper(dataParams)
        if (cancelled) return
        let nextRows: any[] = []
        let nextCount = 0
        if (result !== null && result !== undefined && typeof result === 'object') {
          const o = result as Record<string, unknown>
          const rawList = o['data']
          if (Array.isArray(rawList)) {
            nextRows = rawList.filter((x) => x != null && typeof x === 'object')
          }
          const tc = o['totalCount']
          nextCount =
            typeof tc === 'number' && !Number.isNaN(tc)
              ? tc
              : Math.max(0, Math.floor(Number(tc))) || 0
        }
        setRows(nextRows)
        setRowCount(nextCount)
      } catch {
        if (!cancelled) {
          setRows([])
          setRowCount(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    fetchDataWrapper,
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearch,
    refreshKey,
    sortModel,
  ])

  useEffect(() => {
    const prev = prevSelectionRef.current
    prevSelectionRef.current = normalizedSelection
    if (prev !== '' && normalizedSelection === '') {
      didAutoSelectRef.current = false
    }
  }, [normalizedSelection])

  useEffect(() => {
    if (loading || rows.length === 0 || normalizedSelection) return
    if (didAutoSelectRef.current) return
    const first = rows[0] as Record<string, unknown> | undefined
    const firstKey = first ? rowDetailKey(first) : ''
    if (!firstKey) return
    didAutoSelectRef.current = true
    onSelectRole(firstKey)
  }, [loading, rows, normalizedSelection, onSelectRole])

  const pageIds = useMemo(
    () => rows.map((r) => String((r as Record<string, unknown>).name ?? '')),
    [rows]
  )
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => id && selectedIds.has(id))
  const somePageSelected = pageIds.some((id) => id && selectedIds.has(id))

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => {
          if (id) next.add(id)
        })
      }
      return next
    })
  }

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f9fbff] dark:bg-[#111113]">
      <div className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5">
        <Checkbox
          size="small"
          checked={allPageSelected}
          indeterminate={!allPageSelected && somePageSelected}
          onChange={toggleSelectAll}
          inputProps={{ 'aria-label': 'Select all roles on this page' }}
          sx={{ p: 0.3, color: '#E2E8F0', '&.Mui-checked': { color: '#1D4ED8' } }}
        />
        <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-[#E3ECFC] bg-white px-3 py-1.5 transition-all focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_2px_#4A7AE8] dark:border-[#3F3F46] dark:bg-[#18181B]">
          <MagnifyingGlass size={13} color="#94A3B8" weight="duotone" />
          <InputBase
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{
              flex: 1,
              fontSize: '0.75rem',
              color: theme => (theme.palette.mode === 'dark' ? '#D4D4D8' : '#334155'),
              '& input::placeholder': { color: '#94A3B8', opacity: 1 },
            }}
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress size={28} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-[13px] text-slate-400">No roles found</div>
        ) : (
          rows.map((row) => {
            const r = row as Record<string, unknown>
            const id = String(r.name ?? '')
            const roleName = String(r.role_name ?? '').trim() || '—'
            const description = String(r.role_description ?? '').trim()
            const navKey = rowDetailKey(r)
            const nm = String(r.name ?? '').trim()
            const rn = String(r.role_name ?? '').trim()
            const selectedRow = Boolean(
              normalizedSelection &&
                (normalizedSelection === nm ||
                  normalizedSelection === rn ||
                  normalizedSelection === normalizeRoleKey(nm) ||
                  normalizedSelection === normalizeRoleKey(rn))
            )
            const checked = id ? selectedIds.has(id) : false
            const dis = r.disabled
            const disabled = dis === 1 || dis === true || dis === '1'
            const admin = r.is_admin
            const isAdmin = admin === 1 || admin === true || admin === '1'

            return (
              <div
                key={id || roleName}
                role="button"
                tabIndex={0}
                onClick={() => navKey && onSelectRole(navKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (navKey) onSelectRole(navKey)
                  }
                }}
                className={`flex w-full cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-all ${
                  selectedRow
                    ? 'border-[#1D4ED8] bg-[#EFF6FF] shadow-sm dark:border-[#3F3F46] dark:bg-[#27272A]'
                    : 'border-[#E3ECFC] hover:bg-[#f9fbff] dark:border-[#27272A] dark:hover:bg-[#1C1C1E]'
                }`}
              >
                <Checkbox
                  size="small"
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => id && toggleRow(id)}
                  inputProps={{ 'aria-label': `Select ${roleName}` }}
                  sx={{ p: 0.3, mt: '1px', color: '#E2E8F0', '&.Mui-checked': { color: '#1D4ED8' } }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`truncate text-[14px] font-semibold ${
                        selectedRow
                          ? 'text-[#0C2472] dark:text-[#D4D4D8]'
                          : 'text-slate-600 dark:text-[#71717A]'
                      }`}
                    >
                      {roleName}
                    </span>
                    {disabled ? (
                      <span className="flex-shrink-0 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-1.5 py-px text-[10px] font-bold text-slate-500">
                        Disabled
                      </span>
                    ) : null}
                    {isAdmin ? (
                      <span className="flex-shrink-0 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-1.5 py-px text-[10px] font-bold text-[#B45309]">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  {description ? (
                    <div className="mt-0.5 text-[12px] text-slate-400">{description}</div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {!loading && rowCount > 0 ? (
        <TablePagination
          component="div"
          count={rowCount}
          page={paginationModel.page}
          onPageChange={(_, p) => setPaginationModel((m) => ({ ...m, page: p }))}
          rowsPerPage={paginationModel.pageSize}
          onRowsPerPageChange={(e) =>
            setPaginationModel({
              page: 0,
              pageSize: parseInt(e.target.value, 10),
            })
          }
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: theme => (theme.palette.mode === 'dark' ? '#27272A' : '#E3ECFC'),
            '& .MuiTablePagination-toolbar': { minHeight: 44, px: 2 },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '12px',
              color: '#94A3B8',
            },
            '& .MuiTablePagination-select': { fontSize: '12px', fontWeight: 600 },
          }}
        />
      ) : null}
    </div>
  )
}
