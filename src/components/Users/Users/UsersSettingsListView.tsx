'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import { fetchRawDataGridListing } from '@/services/api/common-erpnext-api/listing-api-get'
import { CONSTANTS } from '@/services/config/app-config'
import CustomAvatar from '@/@core/components/mui/Avatar'
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

function RoleLine({ roleName }: { roleName: string }) {
  if (!roleName?.trim()) return null
  const parts = roleName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 0.5,
        rowGap: 0.25,
      }}
    >
      {parts.map((part, i) => {
        const isBadgeRole = /^super\s*admin$/i.test(part) || /^administrator$/i.test(part)
        return (
          <Box key={`${part}-${i}`} sx={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 ? (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                ,
              </Typography>
            ) : null}
            {isBadgeRole ? (
              <Chip
                label={part}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderColor: 'rgba(245, 166, 35, 0.85)',
                  color: 'rgb(194, 65, 12)',
                  bgcolor: 'rgba(245, 166, 35, 0.14)',
                  '& .MuiChip-label': { px: 0.75 },
                }}
                variant="outlined"
              />
            ) : (
              <Typography component="span" variant="caption" color="text.secondary">
                {part}
              </Typography>
            )}
          </Box>
        )
      })}
    </Box>
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 1.5,
          py: 1.25,
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Checkbox
          size="small"
          checked={allPageSelected}
          indeterminate={!allPageSelected && somePageSelected}
          onChange={toggleSelectAll}
          inputProps={{ 'aria-label': 'Select all users on this page' }}
          sx={{ alignSelf: 'center', mb: 0.25 }}
        />
        <TextField
          variant="standard"
          size="small"
          fullWidth
          placeholder="Search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            disableUnderline: false,
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0.25 }}>
                <SearchIcon sx={{ fontSize: 20, color: 'grey.400' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            '& .MuiInputBase-root': {
              bgcolor: 'transparent',
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: 'rgba(180, 175, 210, 0.55)',
            },
            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
              borderBottomColor: 'rgba(160, 155, 195, 0.75)',
            },
            '& .MuiInput-underline:after': {
              borderBottomWidth: 2,
            },
            '& .MuiInputBase-input': {
              py: 0.75,
              fontSize: '0.9375rem',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(96, 125, 160, 0.75)',
              opacity: 1,
            },
          }}
        />
        {canAdd ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddNew}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            New User
          </Button>
        ) : null}
      </Box>

      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            No users found
          </Typography>
        ) : (
          <List disablePadding sx={{ py: 0 }}>
            {rows.map((row) => {
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

              return (
                <ListItemButton
                  key={id || email}
                  selected={!!selectedRow}
                  onClick={() => id && onSelectUser(id)}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1.5,
                    px: 1.5,
                    gap: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: selectedRow ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(25, 118, 210, 0.12)',
                    },
                    '&:hover': {
                      bgcolor: selectedRow ? 'rgba(25, 118, 210, 0.14)' : 'action.hover',
                    },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={checked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => id && toggleRow(id)}
                    inputProps={{ 'aria-label': `Select ${displayName}` }}
                    sx={{ pt: 0.5 }}
                  />
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <CustomAvatar
                      alt={displayName}
                      src={img ? `${CONSTANTS.API_BASE_URL}${img}` : undefined}
                      size={48}
                      variant="circular"
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 11,
                        height: 11,
                        borderRadius: '50%',
                        bgcolor: enabled ? 'grey.500' : 'grey.400',
                        border: '2px solid',
                        borderColor: 'background.paper',
                      }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                      {displayName}
                    </Typography>
                    <Box sx={{ mt: 0.25 }}>
                      <RoleLine roleName={roleName} />
                    </Box>
                    {email ? (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          color: 'primary.main',
                          wordBreak: 'break-all',
                        }}
                      >
                        {email}
                      </Typography>
                    ) : null}
                  </Box>
                </ListItemButton>
              )
            })}
          </List>
        )}
      </Box>

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
        />
      ) : null}
    </Box>
  )
}
