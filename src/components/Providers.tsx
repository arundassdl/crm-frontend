// Type Imports
import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'

// Component Imports
import MuiAppRouterCache from '@components/theme/MuiAppRouterCache'
// import UpgradeToProButton from '@components/upgrade-to-pro-button'

// Util Imports
import { getMode, getSettingsFromCookie } from '@core/utils/serverHelpers'
import { cookies } from 'next/headers'

type Props = ChildrenType & {
  direction: Direction
}

const Providers = (props: Props) => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = getMode()
  const settingsCookie = getSettingsFromCookie()
  const cookieStore = cookies()
  const isCollapsed = cookieStore.get('sidebar-collapsed')?.value === 'true'

  return (
    <VerticalNavProvider initialToggled={isCollapsed}>
      <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
        <MuiAppRouterCache>
          <ThemeProvider direction={direction}>
            {children}
            {/* <UpgradeToProButton /> */}
          </ThemeProvider>
        </MuiAppRouterCache>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}

export default Providers
