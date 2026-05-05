'use client'
import { readAccessTokenDataJsonString } from '@/utils/accessTokenDataStorage'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import axios from 'axios'

import StyledContainer from '@/@core/theme/overrides/container'
import CustomAvatar from '@/@core/components/mui/Avatar'
import EditableField, { type EditOption } from '@/components/Common/EditableField'
import { showToast } from '@/components/ToastNotificationNew'
import { get_access_token } from '@/store/slices/auth/token-login-slice'
import { CONSTANTS } from '@/services/config/app-config'
import { updateResource } from '@/services/api/common-erpnext-api/create-edit-api'
import { FetchCountryList } from '@/services/api/general_apis/customer-form-data-api'
import { FetchCurrency } from '@/services/api/my-company/FetchCurrency'

const DOCTYPE = 'CRM Company'

/** Redux token is often empty after refresh; Frappe calls use `AccessTokenData` like the rest of the app. */
function readAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = readAccessTokenDataJsonString()
    if (raw == null || raw === '' || raw === 'undefined') return null
    const d = JSON.parse(raw) as { access_token?: string }
    const t = d?.access_token
    return typeof t === 'string' && t.trim() !== '' ? t.trim() : null
  } catch {
    return null
  }
}

function normalizeDocScalar(v: unknown): string {
  if (v == null) return ''
  const s = String(v).trim()
  const isoDay = /^(\d{4}-\d{2}-\d{2})/.exec(s)
  if (isoDay) return isoDay[1]
  return s
}

export type CrmCompanyFormState = {
  company_name: string
  abbr: string
  default_currency: string
  country: string
  tax_id: string
  domain: string
  date_of_establishment: string
  company_logo: string
  date_of_incorporation: string
  phone_no: string
  email: string
  company_description: string
  date_of_commencement: string
  fax: string
  website: string
  registration_details: string
  time_zone: string
}

const emptyForm = (): CrmCompanyFormState => ({
  company_name: '',
  abbr: '',
  default_currency: '',
  country: '',
  tax_id: '',
  domain: '',
  date_of_establishment: '',
  company_logo: '',
  date_of_incorporation: '',
  phone_no: '',
  email: '',
  company_description: '',
  date_of_commencement: '',
  fax: '',
  website: '',
  registration_details: '',
  time_zone: ''
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolveAssetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = CONSTANTS.API_BASE_URL.replace(/\/$/, '')
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

function normalizeCurrencyList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) out.push(item.trim())
    else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const v = o.name ?? o.currency ?? o.currency_name ?? o.label
      if (typeof v === 'string' && v.trim()) out.push(v.trim())
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a.localeCompare(b))
}

function normalizeCountryList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) out.push(item.trim())
    else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const v = o.country_name ?? o.name ?? o.label
      if (typeof v === 'string' && v.trim()) out.push(v.trim())
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a.localeCompare(b))
}

type IntlWithTimeZones = {
  supportedValuesOf?: (key: string) => string[]
}

function ianaTimeZones(): string[] {
  try {
    const { supportedValuesOf } = Intl as unknown as IntlWithTimeZones
    if (typeof supportedValuesOf === 'function') {
      return supportedValuesOf('timeZone').slice().sort((a, b) => a.localeCompare(b))
    }
  } catch {
    /* ignore */
  }
  return ['UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York'].sort()
}

const CRM_DATE_FIELDS: (keyof CrmCompanyFormState)[] = [
  'date_of_establishment',
  'date_of_incorporation',
  'date_of_commencement'
]

function docToForm(doc: Record<string, unknown>): CrmCompanyFormState {
  const s = emptyForm()
  const dateSet = new Set(CRM_DATE_FIELDS)
  const pick = (k: keyof CrmCompanyFormState) => {
    const v = doc[k]
    if (dateSet.has(k)) {
      s[k] = normalizeDocScalar(v)
      return
    }
    s[k] = v == null ? '' : String(v).trim()
  }
  ;(
    [
      'company_name',
      'abbr',
      'default_currency',
      'country',
      'tax_id',
      'domain',
      'date_of_establishment',
      'company_logo',
      'date_of_incorporation',
      'phone_no',
      'email',
      'company_description',
      'date_of_commencement',
      'fax',
      'website',
      'registration_details',
      'time_zone'
    ] as const
  ).forEach(pick)
  return s
}

function unwrapListPayload(body: unknown): unknown[] {
  if (body == null || typeof body !== 'object') return []
  const b = body as Record<string, unknown>
  const d = b.data
  if (Array.isArray(d)) return d
  const m = b.message
  if (Array.isArray(m)) return m
  return []
}

function unwrapDocPayload(body: unknown): Record<string, unknown> | null {
  if (body == null || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const d = b.data
  if (d != null && typeof d === 'object' && !Array.isArray(d)) return d as Record<string, unknown>
  const m = b.message
  if (m != null && typeof m === 'object' && !Array.isArray(m)) return m as Record<string, unknown>
  return null
}

async function fetchCrmCompanyDoc(authToken: string): Promise<Record<string, unknown> | null> {
  const resourceBase = `${CONSTANTS.API_BASE_URL}/api/resource/${encodeURIComponent(DOCTYPE)}`
  const listRes = await axios.get(resourceBase, {
    params: {
      limit_page_length: 1,
      order_by: 'modified desc'
    },
    headers: { Authorization: authToken }
  })

  const rows = unwrapListPayload(listRes.data)
  if (rows.length === 0) return null

  const summary = rows[0] as Record<string, unknown>
  const name = summary?.name != null ? String(summary.name).trim() : ''
  if (!name) return summary

  try {
    const detailRes = await axios.get(`${resourceBase}/${encodeURIComponent(name)}`, {
      headers: { Authorization: authToken }
    })
    const doc = unwrapDocPayload(detailRes.data)
    if (doc) return doc
  } catch {
    /* use list row if single-doc GET fails */
  }
  return summary
}

function withBlankOption(options: string[], current: string): EditOption[] {
  const blank: EditOption = { label: '—', value: '' }
  const rest = options.map(v => ({ label: v, value: v }))
  if (current && !rest.some(o => o.value === current)) {
    rest.unshift({ label: current, value: current })
  }
  return [blank, ...rest]
}

export default function OrganizationCompanySettings() {
  const authState = useSelector(get_access_token)
  const authToken = useMemo(() => {
    const t = authState?.token
    if (typeof t === 'string' && t.trim() !== '') return t.trim()
    return readAccessTokenFromStorage()
  }, [authState?.token])
  const [docName, setDocName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<CrmCompanyFormState>(emptyForm)

  const [currencyOptions, setCurrencyOptions] = useState<string[]>([])
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const timeZoneList = useMemo(() => ianaTimeZones(), [])

  const currencySelectOptions = useMemo(
    () => withBlankOption(currencyOptions, form.default_currency),
    [currencyOptions, form.default_currency]
  )
  const countrySelectOptions = useMemo(
    () => withBlankOption(countryOptions, form.country),
    [countryOptions, form.country]
  )
  const timeZoneSelectOptions = useMemo(
    () => withBlankOption(timeZoneList, form.time_zone),
    [timeZoneList, form.time_zone]
  )

  const canEdit = Boolean(docName) && !loadError

  const loadCompany = useCallback(async () => {
    const token = authToken ?? readAccessTokenFromStorage()
    if (!token) {
      setLoading(false)
      setLoadError('Not signed in.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const doc = await fetchCrmCompanyDoc(token)
      if (doc == null) {
        setDocName(null)
        setForm(emptyForm())
        setLoadError('No CRM Company record found. Create one in the backend, then refresh.')
        return
      }
      const name = doc.name != null ? String(doc.name) : null
      setDocName(name)
      setForm(docToForm(doc))
    } catch (e: unknown) {
      let msg = 'Failed to load company.'
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { message?: string; exc?: string } | undefined
        msg = data?.message ?? data?.exc ?? e.message ?? msg
      }
      setLoadError(msg)
      setDocName(null)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    void loadCompany()
  }, [loadCompany])

  useEffect(() => {
    const token = authToken ?? readAccessTokenFromStorage()
    if (!token) return
    let cancelled = false
    ;(async () => {
      const [curRaw, ctryRaw] = await Promise.all([FetchCurrency(token), FetchCountryList(token)])
      if (cancelled) return
      setCurrencyOptions(normalizeCurrencyList(curRaw))
      setCountryOptions(normalizeCountryList(ctryRaw))
    })()
    return () => {
      cancelled = true
    }
  }, [authToken])

  const setField = <K extends keyof CrmCompanyFormState>(key: K, value: CrmCompanyFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleFieldSave = useCallback(
    async (field: string, value: unknown) => {
      const token = authToken ?? readAccessTokenFromStorage()
      if (!token || !docName) {
        showToast('Not signed in or no company record.', 'error')
        return
      }
      if (field === 'email' && value != null && String(value).trim() !== '') {
        if (!EMAIL_RE.test(String(value).trim())) {
          showToast('Enter a valid email address', 'error')
          return
        }
      }
      const str = value == null ? '' : String(value)
      const result = await updateResource(DOCTYPE, docName, { [field]: str }, token)
      if (result.success) {
        setForm(prev => ({ ...prev, [field]: str } as CrmCompanyFormState))
        showToast('Saved', 'success')
      } else {
        showToast(String(result.message ?? 'Save failed'), 'error')
      }
    },
    [authToken, docName]
  )

  const onLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const token = authToken ?? readAccessTokenFromStorage()
    if (!file || !token || !docName) {
      if (!docName) showToast('Save a company record before uploading a logo.', 'error')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('is_private', '0')
    fd.append('folder', 'Home')
    fd.append('attached_to_doctype', DOCTYPE)
    fd.append('attached_to_name', docName)
    fd.append('attached_to_field', 'company_logo')
    setUploadingLogo(true)
    try {
      const res = await fetch('/api/multifile-upload', {
        method: 'POST',
        body: fd,
        headers: { Authorization: token }
      })
      const result = await res.json()
      const url = result?.message?.file_url
      if (typeof url === 'string' && url) {
        setField('company_logo', url)
        showToast('Logo uploaded', 'success')
      } else {
        showToast('Logo upload failed', 'error')
      }
    } catch {
      showToast('Logo upload failed', 'error')
    } finally {
      setUploadingLogo(false)
    }
  }

  const headerSubtitle = useMemo(() => {
    const parts = [form.country.trim(), form.default_currency.trim(), form.domain.trim()].filter(
      p => Boolean(p) && p.toLowerCase() !== 'null'
    )
    return parts.join(' · ')
  }, [form.country, form.default_currency, form.domain])

  const displayName = form.company_name.trim() || 'Organization'
  const logoSrc = form.company_logo ? resolveAssetUrl(form.company_logo) : undefined

  if (loading) {
    return (
      <StyledContainer maxWidth={false} sx={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
        <Box sx={{ p: 3 }} className="flex min-h-[280px] items-center justify-center text-[var(--mui-palette-text-secondary)]">
          <CircularProgress size={28} sx={{ mr: 2 }} />
          Loading organization…
        </Box>
      </StyledContainer>
    )
  }

  const hasHeaderContacts =
    Boolean(form.email.trim()) || Boolean(form.phone_no.trim()) || Boolean(form.website.trim())

  return (
    <StyledContainer maxWidth={false} sx={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={5} sx={{ pl: 0 }}>
          <Grid item xs={12} sx={{ pt: '0 !important' }}>
            <Box>
              <Card sx={{ boxShadow: 'none', p: 8 }} className="border">
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 3,
                        mb: 0,
                        pb: 2,
                        borderBottom: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                        <CustomAvatar variant="circular" alt={displayName} src={logoSrc} size={96} sx={{ flexShrink: 0 }}>
                          {!logoSrc ? (displayName[0] ?? '?').toUpperCase() : null}
                        </CustomAvatar>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp,image/*"
                          id="org-settings-logo-file"
                          hidden
                          disabled={!docName || uploadingLogo}
                          onChange={onLogoSelected}
                        />
                        <label htmlFor="org-settings-logo-file">
                          <IconButton
                            component="span"
                            disabled={!docName || uploadingLogo}
                            size="small"
                            aria-label="Upload company logo"
                            sx={{
                              position: 'absolute',
                              right: 0,
                              bottom: 0,
                              bgcolor: 'background.paper',
                              boxShadow: 1,
                              border: 1,
                              borderColor: 'divider',
                              '&:hover': { bgcolor: 'action.hover' },
                              width: 32,
                              height: 32
                            }}
                          >
                            {uploadingLogo ? (
                              <CircularProgress size={18} thickness={4} />
                            ) : (
                              <PhotoCameraOutlined sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </label>
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1, width: '100%' }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          flexWrap="wrap"
                          gap={1.5}
                          sx={{ rowGap: 0.75 }}
                        >
                          <Typography
                            component="h2"
                            variant="h5"
                            sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}
                          >
                            {displayName}
                          </Typography>
                          {form.abbr.trim() ? (
                            <Chip
                              label={form.abbr.trim()}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                borderColor: 'rgba(245, 166, 35, 0.85)',
                                color: 'rgb(217, 119, 6)',
                                bgcolor: 'rgba(245, 166, 35, 0.12)',
                                '& .MuiChip-label': { px: 1.25 }
                              }}
                            />
                          ) : null}
                        </Stack>
                        {headerSubtitle ? (
                          <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
                            {headerSubtitle}
                          </Typography>
                        ) : null}
                        {hasHeaderContacts ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            flexWrap="wrap"
                            columnGap={3}
                            rowGap={1}
                            sx={{ mt: 1.25 }}
                          >
                            {form.email.trim() ? (
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <EmailOutlinedIcon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.9 }} />
                                <MuiLink
                                  href={`mailto:${form.email.trim()}`}
                                  underline="hover"
                                  sx={{
                                    fontSize: '0.875rem',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                  }}
                                >
                                  {form.email.trim()}
                                </MuiLink>
                              </Stack>
                            ) : null}
                            {form.phone_no.trim() ? (
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <PhoneOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.primary">
                                  {form.phone_no.trim()}
                                </Typography>
                              </Stack>
                            ) : null}
                            {form.website.trim() ? (
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <LanguageOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                <MuiLink
                                  href={
                                    form.website.trim().startsWith('http')
                                      ? form.website.trim()
                                      : `https://${form.website.trim()}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                  sx={{
                                    fontSize: '0.875rem',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                  }}
                                >
                                  {form.website.trim()}
                                </MuiLink>
                              </Stack>
                            ) : null}
                          </Stack>
                        ) : null}
                        {form.company_logo && canEdit ? (
                          <Button
                            type="button"
                            variant="text"
                            color="secondary"
                            size="small"
                            sx={{ mt: 0.5, p: 0, minWidth: 0, alignSelf: 'flex-start' }}
                            onClick={() => void handleFieldSave('company_logo', '')}
                          >
                            Remove logo
                          </Button>
                        ) : null}
                      </Box>
                    </Box>
                  </Grid>

                  {loadError ? (
                    <Grid item xs={12}>
                      <Typography color="error" sx={{ py: 0 }}>
                        {loadError}
                      </Typography>
                    </Grid>
                  ) : null}

                  <Grid item xs={12}>
                    <Grid container spacing={2} direction="row" rowSpacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mt: 0, mb: 2 }}>
                          General information
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Company Name"
                          field="company_name"
                          value={form.company_name}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Abbreviation"
                          field="abbr"
                          value={form.abbr}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Default Currency"
                          field="default_currency"
                          type="select"
                          options={currencySelectOptions}
                          value={form.default_currency}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Country"
                          field="country"
                          type="select"
                          options={countrySelectOptions}
                          value={form.country}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Tax ID"
                          field="tax_id"
                          value={form.tax_id}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Domain"
                          field="domain"
                          value={form.domain}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Date Of Establishment"
                          field="date_of_establishment"
                          type="date"
                          value={form.date_of_establishment}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Date Of Incorporation"
                          field="date_of_incorporation"
                          type="date"
                          value={form.date_of_incorporation}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Date Of Commencement"
                          field="date_of_commencement"
                          type="date"
                          value={form.date_of_commencement}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Time Zone"
                          field="time_zone"
                          type="select"
                          options={timeZoneSelectOptions}
                          value={form.time_zone}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2} direction="row" rowSpacing={2}>
                      <Grid item xs={12}>
                        <Divider sx={{ borderBottomWidth: '2px', mb: 4 }} />
                        <Typography variant="h6" sx={{ mb: 4 }}>
                          Contact information
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Phone No"
                          field="phone_no"
                          value={form.phone_no}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Email"
                          field="email"
                          type="email"
                          value={form.email}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Fax"
                          field="fax"
                          value={form.fax}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Website"
                          field="website"
                          value={form.website}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2} direction="row" rowSpacing={2}>
                      <Grid item xs={12}>
                        <Divider sx={{ borderBottomWidth: '2px', mb: 4 }} />
                        <Typography variant="h6" sx={{ mb: 4 }}>
                          Other information
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Company Description"
                          field="company_description"
                          type="multiline"
                          value={form.company_description}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <EditableField
                          label="Registration Details"
                          field="registration_details"
                          type="multiline"
                          value={form.registration_details}
                          onSave={handleFieldSave}
                          isEditpermission={canEdit}
                          allowEmptySave
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </StyledContainer>
  )
}
