'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { CaretDown, Check, GearSix, PencilSimple, SquaresFour } from '@phosphor-icons/react'

import {
  SETTINGS_HOME_PAGE_SUBTAB,
  SETTINGS_MODULES_URL_TAB,
  dashboardEditPath,
} from '@/app/settings/utils/moduleSettingsRoutes'
import type { DashboardListItem } from '@/modules/dashboard-builder/types'

type DashboardPageHeaderProps = {
  dashboards: DashboardListItem[]
  selectedDashboardId: string | null
  onDashboardChange: (dashboardId: string) => void
  onRefresh?: () => void
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
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const router = useRouter()

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const closeMenu = () => setMenuAnchor(null)

  const selectedDashboard = useMemo(
    () => dashboards.find(d => d.id === selectedDashboardId),
    [dashboards, selectedDashboardId]
  )
  const triggerLabel = selectedDashboard?.title ?? 'Select Dashboard'

  const handleSelect = (dashboardId: string) => {
    onDashboardChange(dashboardId)
    closeMenu()
  }

  return (
    <Box
      component="header"
      aria-label="Dashboard header"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        columnGap: { xs: 1.5, sm: 2 },
        rowGap: 2,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Left: icon + title + subtitle ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(29,78,216,0.15)' : '#EFF6FF',
            flexShrink: 0,
          }}
        >
          <SquaresFour size={18} weight="duotone" color="#1D4ED8" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              m: 0,
              fontSize: '20px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: isDark ? '#F4F4F5' : '#0C2472',
            }}
          >
            Dashboard
          </Typography>
          <Typography
            sx={{
              m: 0,
              mt: 0.25,
              fontSize: '12px',
              lineHeight: 1.2,
              color: isDark ? '#9CA3AF' : '#64748B',
            }}
          >
            {selectedDashboard?.title ?? 'Your dashboard overview'}
          </Typography>
        </Box>
      </Box>

      {/* ── Right: dashboard switcher ── */}
      <Button
        onClick={e => setMenuAnchor(e.currentTarget)}
        variant="outlined"
        endIcon={<CaretDown size={13} weight="bold" />}
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '9px',
          color: isDark ? '#D4D4D8' : '#0C2472',
          borderColor: isDark ? '#27272A' : '#E3ECFC',
          bgcolor: isDark ? '#18181B' : '#fff',
          '&:hover': {
            bgcolor: isDark ? '#27272A' : '#EFF6FF',
            borderColor: isDark ? '#27272A' : '#E3ECFC',
          },
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {triggerLabel}
      </Button>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 0.75,
            borderRadius: '12px',
            minWidth: 220,
            py: 0.5,
            bgcolor: isDark ? '#18181B' : '#fff',
            border: `1px solid ${isDark ? '#27272A' : '#E3ECFC'}`,
            boxShadow: isDark
              ? '0 8px 24px rgba(0,0,0,0.45)'
              : '0 8px 24px rgba(15,23,42,0.12)',
          },
        }}
      >
        {dashboards.map(dashboardOption => {
          const isSelected = dashboardOption.id === selectedDashboardId
          return (
            <MenuItem
              key={dashboardOption.id}
              onClick={() => handleSelect(dashboardOption.id)}
              selected={isSelected}
              sx={{
                py: 1,
                px: 1.75,
                mx: 0.5,
                borderRadius: '8px',
                '&.Mui-selected': { bgcolor: isDark ? '#27272A' : '#EFF6FF' },
              }}
            >
              <ListItemText
                primaryTypographyProps={{
                  fontSize: 13.5,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#1D4ED8' : undefined,
                }}
              >
                {dashboardOption.title}
              </ListItemText>
              {isSelected && <Check size={15} weight="bold" color="#1D4ED8" />}
            </MenuItem>
          )
        })}

        <Divider sx={{ my: 0.5, borderColor: isDark ? '#27272A' : '#E3ECFC' }} />

        {selectedDashboardId && (
          <MenuItem
            onClick={() => {
              closeMenu()
              router.push(dashboardEditPath(selectedDashboardId))
            }}
            sx={{ py: 1, px: 1.75, mx: 0.5, borderRadius: '8px' }}
          >
            <PencilSimple size={16} weight="duotone" className="mr-2.5" />
            <ListItemText primaryTypographyProps={{ fontSize: 13.5 }}>
              Edit dashboard
            </ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            closeMenu()
            router.push(homePageSettingsPath())
          }}
          sx={{ py: 1, px: 1.75, mx: 0.5, borderRadius: '8px' }}
        >
          <GearSix size={16} weight="duotone" className="mr-2.5" />
          <ListItemText primaryTypographyProps={{ fontSize: 13.5 }}>
            Manage Dashboards
          </ListItemText>
        </MenuItem>

        {onRefresh && (
          <MenuItem
            onClick={() => {
              closeMenu()
              onRefresh()
            }}
            sx={{ py: 1, px: 1.75, mx: 0.5, borderRadius: '8px' }}
          >
            <i className="ri-refresh-line mr-2.5 text-[16px]" />
            <ListItemText primaryTypographyProps={{ fontSize: 13.5 }}>Refresh</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}
