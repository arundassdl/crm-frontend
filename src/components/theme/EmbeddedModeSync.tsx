'use client'

// newdocs/80 §12.9: inside EVOQ CTRL, CRM follows CTRL's light/dark appearance.
import { useEffect, useSyncExternalStore } from 'react'

import { useSettings } from '@core/hooks/useSettings'
import { currentAppearance, subscribeAppearance } from '@/lib/embed-client'

/**
 * Page-only: the mode is applied without writing CRM's settings cookie, so the standalone site
 * (and its own Light/Dark choice) is untouched. Outside a frame there is no appearance and this
 * does nothing.
 */
const EmbeddedModeSync = () => {
  const { settings, updateSettings } = useSettings()
  const appearance = useSyncExternalStore(subscribeAppearance, currentAppearance, () => null)

  useEffect(() => {
    if (appearance && appearance !== settings.mode) updateSettings({ mode: appearance }, { updateCookie: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance, settings.mode])

  return null
}

export default EmbeddedModeSync
