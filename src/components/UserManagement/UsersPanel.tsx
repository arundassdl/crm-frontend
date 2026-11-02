'use client'
// R63 (doc 67): organization users for CRM managers — search, role and suspend/restore. People are
// invited in EVOQ CTRL; nobody is created or deleted here.
import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { UmError, umFetch } from './api'

type User = { user: string; full_name: string | null; email: string | null; enabled: boolean; role_profile: string | null; last_active: string | null; is_owner?: boolean }
type Page = { users: User[]; total: number }

export default function UsersPanel() {
  const [page, setPage] = useState<Page | null>(null)
  const [error, setError] = useState<UmError | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState(20)
  const [me, setMe] = useState<string | null>(null)

  const load = useCallback(async () => {
    const q = new URLSearchParams({ start: String(index * size), page_length: String(size) })
    if (search.trim()) q.set('search', search.trim())
    if (status) q.set('status', status)
    try { setPage(await umFetch<Page>(`/api/user-management/users?${q}`)); setError(null) } catch (e) { setError(e as UmError) }
  }, [index, size, search, status])

  useEffect(() => { load() }, [load])
  useEffect(() => { umFetch<{ user: string }>('/api/account/me').then(m => setMe(m.user)).catch(() => {}) }, [])

  const act = async (path: string, body: object, done: string) => {
    setNotice(null)
    try { await umFetch(path, { method: 'POST', body: JSON.stringify(body) }); setNotice(done); await load() } catch (e) { setError(e as UmError) }
  }

  if (error && !page) return <Alert severity={error.status === 503 ? 'info' : 'warning'} data-testid='users-unavailable'>{error.message}</Alert>

  return (
    <Card data-testid='users-panel'>
      <CardContent className='flex flex-col gap-4'>
        <Typography variant='h5'>Users</Typography>
        <Typography variant='body2' color='text.secondary'>Invite people to your organization in EVOQ CTRL. Here you can set their CRM role or suspend their access.</Typography>
        {error && <Alert severity='error'>{error.message}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}
        <div className='flex flex-col sm:flex-row gap-3'>
          <TextField size='small' label='Search' value={search} onChange={e => { setIndex(0); setSearch(e.target.value) }} inputProps={{ 'data-testid': 'users-search' }} />
          <Select size='small' value={status} displayEmpty onChange={e => { setIndex(0); setStatus(String(e.target.value)) }}>
            <MenuItem value=''>All users</MenuItem><MenuItem value='active'>Active</MenuItem><MenuItem value='suspended'>Suspended</MenuItem>
          </Select>
        </div>
        <Table size='small'>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {(page?.users || []).map(u => {
              const self = u.user === me
              // R64: the organization owner is managed in EVOQ only (ownership moves via Central).
              const locked = self || !!u.is_owner
              return (
                <TableRow key={u.user} data-testid='users-row'>
                  <TableCell>{u.full_name || u.user}{self && ' (you)'}
                    {u.is_owner && <Chip size='small' variant='outlined' label='Owner' className='mis-2' data-testid='owner-badge' />}
                  </TableCell>
                  <TableCell>{u.email || u.user}</TableCell>
                  <TableCell>
                    <Select size='small' value={u.role_profile || ''} disabled={locked}
                      onChange={e => act('/api/user-management/role-profile', { user: u.user, role_profile: e.target.value }, 'Role updated.')}>
                      <MenuItem value='EVOQ CRM User'>User</MenuItem><MenuItem value='EVOQ CRM Manager'>Manager</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell><Chip size='small' label={u.enabled ? 'Active' : 'Suspended'} color={u.enabled ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    {u.is_owner && !self && <Typography variant='caption' color='text.secondary'>Managed in EVOQ</Typography>}
                    {!locked && (
                      <Button size='small' color={u.enabled ? 'error' : 'primary'}
                        onClick={() => act('/api/user-management/status', { user: u.user, active: !u.enabled }, u.enabled ? 'Access suspended.' : 'Access restored.')}>
                        {u.enabled ? 'Suspend' : 'Restore'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {page && page.users.length === 0 && <TableRow><TableCell colSpan={5}>No users match.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component='div' count={page?.total || 0} page={index} rowsPerPage={size} rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => setIndex(p)} onRowsPerPageChange={e => { setIndex(0); setSize(Number(e.target.value)) }} />
      </CardContent>
    </Card>
  )
}
