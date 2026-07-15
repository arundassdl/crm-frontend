/*
 * If you change the following items in the config object, you will not see any effect in the local development server
 * as these are stored in the cookie (cookie has the highest priority over the themeConfig):
 * 1. mode
 *
 * To see the effect of the above items, you can click on the reset button from the Customizer
 * which is on the top-right corner of the customizer besides the close button.
 * This will reset the cookie to the values provided in the config object below.
 *
 * Another way is to clear the cookie from the browser's Application/Storage tab and then reload the page.
 */

// Type Imports
import type { Mode } from '@core/types'

export type Config = {
  templateName: string
  templateDesc: string
  footerText: string
  settingsCookieName: string
  mode: Mode
  layoutPadding: number
  compactContentWidth: number
  disableRipple: boolean
  fontFamily: string
  backgroundColor: string
}

const themeConfig: Config = {
  templateName: 'Social DNA Labs',
  templateDesc: 'Software development company',
  footerText: 'Social DNA Labs',
  settingsCookieName: 'sdl',
  mode: 'light', // 'light', 'dark'
  layoutPadding: 20, // Common padding for header, content, footer layout components (in px)
  compactContentWidth: -1, // in px
  disableRipple: false, // true, false
  // Match `@fontsource/inter` (see `inter-fonts.ts`); not `next/font` (avoids build-time Google fetch)
  fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  backgroundColor: '#EBF3FE', // Background color for the layout components (header, content, footer)
}

export default themeConfig
