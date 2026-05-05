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
import { fetchRawDataGridListing } from '@/services/api/common-erpnext-api/listing-api-get'
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
  userToken: { access_token?: string; role_profile?: string; username?: string }
  settingsDetailKey?: string
}

export default function RolesSettingsListView({
  refreshKey,
  onSelectRole,
  userToken,
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

  const fetchDataWrapper = useCallback(
    (params: any, token: string | undefined) => {
      return fetchRawDataGridListing(
        params,
        token ?? '',
        colFields,
        ROLE_DOCTYPE,
        [],
        '',
        '',
        [],
        '',
        wherecondition,
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
        doctype: ROLE_DOCTYPE,
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
          inputProps={{ 'aria-label': 'Select all roles on this page' }}
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
      </Box>

      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            No roles found
          </Typography>
        ) : (
          <List disablePadding sx={{ py: 0 }}>
            {rows.map((row) => {
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
                <ListItemButton
                  key={id || roleName}
                  selected={!!selectedRow}
                  onClick={() => navKey && onSelectRole(navKey)}
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
                    inputProps={{ 'aria-label': `Select ${roleName}` }}
                    sx={{ pt: 0.5 }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                      {roleName}
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                      {disabled ? (
                        <Chip label="Disabled" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                      ) : null}
                      {isAdmin ? (
                        <Chip
                          label="Admin"
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      ) : null}
                    </Box>
                    {description ? (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          color: 'text.secondary',
                          wordBreak: 'break-word',
                        }}
                      >
                        {description}
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
