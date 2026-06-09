'use client'

import { useMemo } from 'react'
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'

import {
  SETTINGS_HOME_PAGE_SUBTAB,
  SETTINGS_MODULES_URL_TAB,
  dashboardEditPath,
} from '@/app/settings/utils/moduleSettingsRoutes'
import type { DashboardListItem } from '@/modules/dashboard-builder/types'
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'
import { readUserProfileDataJsonString } from '@/utils/userProfileDataStorage'

import OptionMenu from './option-menu'
import type { OptionMenuItemType } from './option-menu/types'

type DashboardPageHeaderProps = {
  dashboards: DashboardListItem[]
  selectedDashboardId: string | null
  onDashboardChange: (dashboardId: string) => void
  onRefresh?: () => void
}

function resolveWelcomeName(): string {
  const token = readAccessTokenDataParsed<{ full_name?: string; username?: string }>()
  const candidates = [token.full_name]

  try {
    const profileRaw = readUserProfileDataJsonString()
    if (profileRaw) {
      const profile = JSON.parse(profileRaw) as { full_name?: string }
      candidates.push(profile.full_name)
    }
  } catch {
    /* ignore */
  }

  candidates.push(token.username)

  for (const value of candidates) {
    if (typeof value !== 'string' || !value.trim()) continue
    const trimmed = value.trim()
    if (trimmed.includes('@')) {
      return trimmed.split('@')[0] || trimmed
    }
    return trimmed.split(/\s+/)[0] || trimmed
  }

  return 'there'
}

function homePageSettingsPath(): string {
  return `/settings?tab=${SETTINGS_MODULES_URL_TAB}&subtab=${SETTINGS_HOME_PAGE_SUBTAB}`
}

export default function DashboardPageHeader({
  dashboards,
  selectedDashboardId,
  onDashboardChange,
  onRefresh,
}: DashboardPageHeaderProps) {
  const welcomeName = useMemo(() => resolveWelcomeName(), [])
  const selectedDashboard = dashboards.find(d => d.id === selectedDashboardId)

  const menuOptions = useMemo((): OptionMenuItemType[] => {
    const items: OptionMenuItemType[] = []

    if (selectedDashboardId) {
      items.push({
        text: 'Edit dashboard',
        icon: <i className="ri-edit-line" />,
        href: dashboardEditPath(selectedDashboardId),
      })
    }

    items.push({
      text: 'Manage home pages',
      icon: <i className="ri-layout-grid-line" />,
      href: homePageSettingsPath(),
    })

    if (onRefresh) {
      items.push({
        text: 'Refresh',
        icon: <i className="ri-refresh-line" />,
        menuItemProps: {
          onClick: () => onRefresh(),
        },
      })
    }

    return items
  }, [onRefresh, selectedDashboardId])

  const handleDashboardChange = (event: SelectChangeEvent<string>) => {
    onDashboardChange(event.target.value)
  }

  return (
    <Box
      component="header"
      aria-label="Dashboard header"
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: { xs: 1.5, sm: 2 },
        rowGap: { xs: 1.5, sm: 2 },
        pb: { xs: 2, md: 2.5 },
        mb: { xs: 2, md: 3 },
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.25, sm: 1.75 },
          minWidth: 0,
          flex: '1 1 200px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            borderRadius: 1.5,
            bgcolor: 'primary.lightOpacity',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <i className="ri-dashboard-line text-xl" aria-hidden />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              lineHeight: 1.3,
              color: 'text.primary',
            }}
          >
            Welcome, {welcomeName}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: { xs: 'none', sm: 'block' },
              mt: 0.25,
              lineHeight: 1.4,
            }}
          >
            {selectedDashboard?.title ?? 'Your dashboard overview'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: { xs: 0.75, sm: 1 },
          flex: '0 0 auto',
          width: { xs: '100%', sm: 'auto' },
          ml: { xs: 0, sm: 'auto' },
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 0, sm: 220, md: 260 },
            flex: { xs: '1 1 auto', sm: '0 1 260px' },
            maxWidth: { xs: '100%', sm: 320 },
          }}
        >
          <Select
            value={selectedDashboardId ?? ''}
            onChange={handleDashboardChange}
            displayEmpty
            renderValue={() => selectedDashboard?.title ?? 'Select Dashboard'}
            aria-label="Dashboard selector"
            sx={{
              bgcolor: 'background.paper',
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            {dashboards.map(dashboardOption => (
              <MenuItem key={dashboardOption.id} value={dashboardOption.id}>
                {dashboardOption.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <OptionMenu
          iconClassName="ri-more-2-line text-xl"
          iconButtonProps={{
            sx: { p: 0.75, flexShrink: 0 },
            'aria-label': 'Dashboard actions',
          }}
          options={menuOptions}
          leftAlignMenu={false}
        />
      </Box>
    </Box>
  )
}
