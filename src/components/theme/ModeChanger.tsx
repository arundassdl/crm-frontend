// React Imports
import { useEffect } from 'react'

// MUI Imports
import { useColorScheme } from '@mui/material/styles'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const ModeChanger = () => {
  // Hooks
  const { setMode } = useColorScheme()
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.mode) {
      setMode(settings.mode)
      if (typeof window !== 'undefined') {
        const root = document.documentElement
        if (settings.mode === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode])

  return null
}

export default ModeChanger
