'use client'

import type { ReactNode } from 'react'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import type { Direction } from '@core/types'
import themeConfig from '@configs/themeConfig'

/**
 * Client-only stack matching `(dashboard)/layout` `Providers` (server `getMode` is unavailable in `pages/_app`).
 * Used only for `src/pages/analytics/*` so Module Federation pages match the main CRM shell.
 */
export function ClientDashboardProviders({
  children,
  direction = 'ltr',
}: {
  children: ReactNode
  direction?: Direction
}) {
  return (
    <VerticalNavProvider>
      <SettingsProvider settingsCookie={{}} mode={themeConfig.mode}>
        <ThemeProvider direction={direction}>{children}</ThemeProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}
