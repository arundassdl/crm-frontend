'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Checkbox, CircularProgress, InputBase, TablePagination } from '@mui/material'
import Button from '@mui/material/Button'
import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { fetchRawDataGridListing } from '@/services/api/common-erpnext-api/listing-api-get'
import { CONSTANTS } from '@/services/config/app-config'
import CustomAvatar from '@/@core/components/mui/Avatar'
import { RoleBadge } from '@/components/Users/Users/Detail/ProfileCards'
import type { GridFilterModel, GridSortModel } from '@mui/x-data-grid'

/** Do not name this `module` — it shadows webpack's `module` and breaks the client bundle. */
const USER_DOCTYPE = 'User'
const relatedDocs = ['SDL Role']
const include_contact = 'False'
const Joinquery =
  'INNER JOIN `tabSDL Role` ON `tabUser`.role_profile_name = `tabSDL Role`.role_profile'

const colFields = [
  { doctype: USER_DOCTYPE, field: 'name', hidden: 'True' },
  { doctype: USER_DOCTYPE, field: 'username', hidden: 'False' },
  { doctype: USER_DOCTYPE, field: 'full_name', hidden: 'True' },
  { doctype: USER_DOCTYPE, field: 'email', hidden: 'False' },
  { doctype: USER_DOCTYPE, field: 'mobile_no', hidden: 'False' },
  { doctype: USER_DOCTYPE, field: 'enabled', hidden: 'False' },
  { doctype: 'SDL Role', field: 'role_name', hidden: 'False' },
  { doctype: USER_DOCTYPE, field: 'creation', hidden: 'False' },
  { doctype: USER_DOCTYPE, field: 'modified', hidden: 'False' },
  { doctype: USER_DOCTYPE, field: 'user_image', hidden: 'True' },
]

function normalizeUserKey(s: string | null | undefined): string {
  if (s == null) return ''
  const t = String(s).trim()
  if (!t) return ''
  try {
    return decodeURIComponent(t)
  } catch {
    return t
  }
}

/** Pastel initials bubbles, matching the settings reference list. */
const LIST_AVATAR_PALETTE: { bg: string; text: string }[] = [
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#EDE9FE', text: '#6D28D9' },
  { bg: '#DCFCE7', text: '#166534' },
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#FEF2F2', text: '#DC2626' },
  { bg: '#FDF4FF', text: '#7E22CE' },
]

function listAvatarColors(name: string): { bg: string; text: string } {
  const key = String(name ?? '').trim()
  if (!key) return LIST_AVATAR_PALETTE[0]
  const sum = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return LIST_AVATAR_PALETTE[sum % LIST_AVATAR_PALETTE.length]
}

function initialsOf(name: string): string {
  const parts = String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function RoleLine({ roleName }: { roleName: string }) {
  if (!roleName?.trim()) return null
  const parts = roleName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((part, i) => (
        <RoleBadge key={`${part}-${i}`} role={part} />
      ))}
    </span>
  )
}

type UsersSettingsListViewProps = {
  refreshKey: number
  onAddNew: () => void
  onSelectUser: (name: string) => void
  userToken: { access_token?: string; role_profile?: string; username?: string }
  /** Current `detail` query from parent (avoids useSearchParams here). */
  settingsDetailKey?: string
}

export default function UsersSettingsListView({
  refreshKey,
  onAddNew,
  onSelectUser,
  userToken,
  settingsDetailKey = '',
}: UsersSettingsListViewProps) {
  const normalizedSelection = useMemo(
    () => normalizeUserKey(settingsDetailKey),
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

  /** After load, open first user in detail pane when URL has no `detail` (once until selection exists). */
  const didAutoSelectRef = useRef(false)
  const prevSelectionRef = useRef<string>('')

  const [userPermission, setUserPermission] = useState<any>(() => {
    const raw = JSON.parse(localStorage.getItem('userpermission') || '[]')
    const arr = Array.isArray(raw) ? raw : []
    return arr.find((m: any) => m.frontend_module === 'Users') || {}
  })

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }))
  }, [debouncedSearch])

  const fetchDataWrapper = useCallback(
    (params: any, token: string | undefined) => {
      return fetchRawDataGridListing(
        params,
        token ?? '',
        colFields,
        USER_DOCTYPE,
        relatedDocs,
        include_contact,
        '',
        '',
        Joinquery,
        '',
        userToken?.role_profile,
        userToken?.username
      )
    },
    [userToken?.role_profile, userToken?.username]
  )

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const filterModel: GridFilterModel = {
        items: [],
        quickFilterValues: debouncedSearch ? [debouncedSearch] : [],
      }
      const dataParams = {
        doctype: USER_DOCTYPE,
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        filters: filterModel,
        sort: sortModel,
      }
      try {
        const result: unknown = await fetchDataWrapper(dataParams, userToken?.access_token)
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
    userToken?.access_token,
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
    const firstId = String((rows[0] as Record<string, unknown>)?.name ?? '').trim()
    if (!firstId) return
    didAutoSelectRef.current = true
    onSelectUser(firstId)
  }, [loading, rows, normalizedSelection, onSelectUser])

  const pageIds = useMemo(() => rows.map((r) => String(r.name ?? '')), [rows])
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

  const canAdd = userPermission?.create === 1 || userPermission?.create === '1'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f9fbff] dark:bg-[#111113]">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#E3ECFC] px-4 py-3 dark:border-[#27272A]">
        <Checkbox
          size="small"
          checked={allPageSelected}
          indeterminate={!allPageSelected && somePageSelected}
          onChange={toggleSelectAll}
          inputProps={{ 'aria-label': 'Select all users on this page' }}
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
        {canAdd ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={12} weight="bold" />}
            onClick={onAddNew}
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              bgcolor: '#1D4ED8',
              color: 'white',
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.73rem',
              px: 1.5,
              py: 0.7,
              boxShadow: '0 1px 6px #1D4ED833',
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            New User
          </Button>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress size={28} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-[13px] text-slate-400">No users found</div>
        ) : (
          rows.map((row) => {
            const id = String((row as Record<string, unknown>).name ?? '')
            const r = row as Record<string, unknown>
            const displayName =
              (r['full_name'] as string) ||
              [r['first_name'], r['last_name']].filter(Boolean).join(' ') ||
              (r['name'] as string) ||
              '—'
            const email = (r['email'] as string) ?? ''
            const roleName = (r['role_name'] as string) ?? ''
            const img = r['user_image'] as string | undefined
            const selectedRow = Boolean(
              normalizedSelection && id && normalizeUserKey(id) === normalizedSelection
            )
            const checked = id ? selectedIds.has(id) : false
            const en = r['enabled']
            const enabled = en !== 0 && en !== false && en !== '0'
            const colors = listAvatarColors(displayName)

            return (
              <div
                key={id || email}
                role="button"
                tabIndex={0}
                onClick={() => id && onSelectUser(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (id) onSelectUser(id)
                  }
                }}
                className={`flex cursor-pointer items-center gap-3 border-b border-[#EFF6FF] px-4 py-3 transition-colors dark:border-[#27272A] ${
                  selectedRow
                    ? 'bg-[#EFF6FF] dark:bg-[#27272A]'
                    : 'hover:bg-[#f9fbff] dark:hover:bg-[#18181B]'
                }`}
              >
                <Checkbox
                  size="small"
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => id && toggleRow(id)}
                  inputProps={{ 'aria-label': `Select ${displayName}` }}
                  sx={{ p: 0.3, color: '#E2E8F0', '&.Mui-checked': { color: '#1D4ED8' } }}
                />
                {img ? (
                  <CustomAvatar
                    alt={displayName}
                    src={`${CONSTANTS.API_BASE_URL}${img}`}
                    size={36}
                    variant="circular"
                    sx={{ flexShrink: 0 }}
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {initialsOf(displayName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span
                      className={`truncate text-[14px] font-semibold ${
                        selectedRow
                          ? 'text-[#1D4ED8] dark:text-[#F4F4F5]'
                          : 'text-slate-800 dark:text-[#D4D4D8]'
                      }`}
                    >
                      {displayName}
                    </span>
                    <span className="flex-shrink-0">
                      <RoleLine roleName={roleName} />
                    </span>
                  </div>
                  <div className="truncate text-[12px] text-slate-400">{email}</div>
                </div>
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    enabled ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`}
                />
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
