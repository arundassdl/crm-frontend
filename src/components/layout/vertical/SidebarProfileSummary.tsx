'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// Config/Util Imports
import { CONSTANTS } from '@/services/config/app-config'
import { readUserProfileDataJsonString } from '@/utils/userProfileDataStorage'

function profileRecordFromStored(parsed: unknown): Record<string, unknown> | null {
  if (parsed == null) return null
  if (Array.isArray(parsed)) {
    const first = parsed[0]
    return first && typeof first === 'object' && !Array.isArray(first) ? (first as Record<string, unknown>) : null
  }
  return typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
}

function getFullImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath
  const base = String(CONSTANTS?.API_BASE_URL ?? '').replace(/\/$/, '')
  const p = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return encodeURI(`${base}${p}`)
}

type SidebarProfileSummaryProps = {
  collapsed: boolean
}

/**
 * Static profile summary pinned to the sidebar bottom (reference: `Sidebar.tsx`'s bottom
 * section). Display-only — the account menu (My Account / Logout) lives in the top navbar's
 * `UserDropdown`, not here.
 */
const SidebarProfileSummary = ({ collapsed }: SidebarProfileSummaryProps) => {
  const [userData, setUserData] = useState<Record<string, unknown>>({})
  const [avatarUrl, setAvatarUrl] = useState('/images/avatars/5.png')

  useEffect(() => {
    const sync = () => {
      try {
        const raw = readUserProfileDataJsonString()
        const record = raw ? profileRecordFromStored(JSON.parse(raw)) : null
        if (!record) return
        setUserData(record)
        const path = String(record.user_image ?? record.image ?? '').trim()
        setAvatarUrl(path ? getFullImageUrl(path) : '/images/avatars/5.png')
      } catch {
        /* ignore */
      }
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('userProfileData-updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('userProfileData-updated', sync)
    }
  }, [])

  const fullName = String(userData.full_name ?? 'User')
  const roleAndEmail = [userData.userType, userData.email].filter(Boolean).join(' · ')

  const avatar = (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <Avatar src={avatarUrl} alt={fullName} sx={{ width: collapsed ? 34 : 30, height: collapsed ? 34 : 30 }} />
      <Box
        sx={{
          position: 'absolute',
          insetBlockEnd: 0,
          insetInlineEnd: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#34d399',
          border: '2px solid var(--nav-chrome-bg)'
        }}
      />
    </Box>
  )

  if (collapsed) {
    return (
      <Tooltip title={roleAndEmail ? `${fullName} — ${roleAndEmail}` : fullName} placement='right'>
        <Box sx={{ display: 'flex', justifyContent: 'center', paddingBlock: 0.5 }}>{avatar}</Box>
      </Tooltip>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        marginBlockStart: 0.5,
        paddingInline: 1.5,
        paddingBlock: 1,
        borderRadius: '8px',
        backgroundColor: 'var(--nav-chrome-active-bg)',
        border: '1px solid var(--nav-chrome-border)'
      }}
    >
      {avatar}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: 'var(--nav-chrome-text-primary)' }}>
          {fullName}
        </Typography>
        {roleAndEmail && (
          <Typography noWrap sx={{ fontSize: 10, color: 'var(--nav-chrome-text-muted)' }}>
            {roleAndEmail}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default SidebarProfileSummary
