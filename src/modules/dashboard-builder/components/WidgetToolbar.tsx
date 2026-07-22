'use client'

import { memo } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowsClockwise, ArrowsOut, PencilSimple, Trash } from '@phosphor-icons/react'

type WidgetToolbarProps = {
  onRefresh?: () => void
  onFullscreen?: () => void
  onEdit?: () => void
  onRemove?: () => void
  compact?: boolean
}

function WidgetToolbarInner({
  onRefresh,
  onFullscreen,
  onEdit,
  onRemove,
  compact,
}: WidgetToolbarProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  /** Same button treatment as the reference card actions. */
  const btnSx = {
    p: 0.4,
    borderRadius: '7px',
    color: isDark ? '#9CA3AF' : '#64748B',
    bgcolor: isDark ? '#18181B' : '#F1F5F9',
    '&:hover': {
      color: isDark ? '#D4D4D8' : '#334155',
      bgcolor: isDark ? '#27272A' : '#E2E8F0',
    },
  } as const

  const deleteSx = {
    ...btnSx,
    '&:hover': { color: '#EF4444', bgcolor: isDark ? '#27272A' : '#FEE2E2' },
  } as const

  return (
    // `widget-no-drag` keeps these actions from starting a layout drag.
    <div className={`widget-no-drag flex items-center gap-0.5 ${compact ? '' : 'ml-auto'}`}>
      <Tooltip title="Refresh">
        <IconButton size="small" aria-label="Refresh" onClick={onRefresh} sx={btnSx}>
          <ArrowsClockwise size={11} weight="bold" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Expand">
        <IconButton size="small" aria-label="Expand" onClick={onFullscreen} sx={btnSx}>
          <ArrowsOut size={11} weight="bold" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label="Edit" onClick={onEdit} sx={btnSx}>
          <PencilSimple size={11} weight="bold" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton size="small" aria-label="Delete" onClick={onRemove} sx={deleteSx}>
          <Trash size={11} weight="bold" />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export const WidgetToolbar = memo(WidgetToolbarInner)
