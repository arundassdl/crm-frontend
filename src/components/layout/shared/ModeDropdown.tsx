'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import { SunIcon, MoonIcon } from '@phosphor-icons/react'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const ModeDropdown = () => {
  // States
  const [tooltipOpen, setTooltipOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings, updateSettings } = useSettings()

  const handleToggle = () => {
    if (settings.mode === 'dark') {
      updateSettings({ mode: 'light' })
    }

    if (settings.mode === 'light') {
      updateSettings({ mode: 'dark' })
    }
  }

  return (
    <>
      <Tooltip
        title={settings.mode == 'dark' ? 'Light Mode' : 'Dark Mode'}
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        open={tooltipOpen}
        PopperProps={{ className: 'capitalize' }}
      >
        <IconButton ref={anchorRef} onClick={handleToggle} sx={{ color: 'inherit' }}>
          {settings.mode === 'dark' ? <SunIcon size={20} weight='duotone' /> : <MoonIcon size={20} weight='duotone' />}
        </IconButton>
      </Tooltip>
    </>
  )
}

export default ModeDropdown
