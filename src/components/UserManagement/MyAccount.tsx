'use client'
// R63 (doc 67): My Account — the signed-in user's own profile. Name is editable; identity, email,
// roles and organization are managed by EVOQ and shown read-only.
import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { UmError, profileLabel, umFetch } from './api'

type Me = {
  user: string
  first_name: string | null
  last_name: string | null
  email: string | null
  enabled: boolean
  role_profile: string | null
  roles: string[]
  organization: string | null
}

export default function MyAccount() {
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<UmError | null>(null)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    umFetch<Me>('/api/account/me')
      .then(m => { setMe(m); setFirst(m.first_name || ''); setLast(m.last_name || '') })
      .catch(e => setError(e))
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false); setError(null)
    try {
      const m = await umFetch<Me>('/api/account/me', { method: 'POST', body: JSON.stringify({ first_name: first, last_name: last }) })
      setMe(m); setSaved(true)
    } catch (e) { setError(e as UmError) } finally { setSaving(false) }
  }

  if (error && !me) return <Alert severity={error.status === 503 ? 'info' : 'warning'} data-testid='my-account-unavailable'>{error.message}</Alert>
  if (!me) return <CircularProgress data-testid='my-account-loading' />

  return (
    <Card data-testid='my-account'>
      <CardContent className='flex flex-col gap-5'>
        <Typography variant='h5'>My Account</Typography>
        {error && <Alert severity='error'>{error.message}</Alert>}
        {saved && <Alert severity='success'>Your name has been updated.</Alert>}
        <div className='flex flex-col sm:flex-row gap-4'>
          <TextField label='First name' value={first} onChange={e => setFirst(e.target.value)} fullWidth inputProps={{ maxLength: 140, 'data-testid': 'my-account-first-name' }} />
          <TextField label='Last name' value={last} onChange={e => setLast(e.target.value)} fullWidth inputProps={{ maxLength: 140 }} />
        </div>
        <TextField label='Email' value={me.email || me.user} disabled fullWidth helperText='Your sign-in email is managed in your EVOQ account.' />
        <div className='flex flex-wrap gap-3 items-center'>
          <Typography variant='body2'>Organization:</Typography><Chip label={me.organization || '—'} size='small' />
          <Typography variant='body2'>Role:</Typography><Chip label={profileLabel(me.role_profile)} size='small' color='primary' data-testid='my-account-role' />
          <Typography variant='body2'>Status:</Typography><Chip label={me.enabled ? 'Active' : 'Suspended'} size='small' color={me.enabled ? 'success' : 'default'} />
        </div>
        <Typography variant='body2' color='text.secondary'>Your role is set by a CRM manager in your organization. To change your password or organization, use your EVOQ account.</Typography>
        <div><Button variant='contained' onClick={save} disabled={saving || !first.trim()} data-testid='my-account-save'>{saving ? 'Saving…' : 'Save changes'}</Button></div>
      </CardContent>
    </Card>
  )
}
