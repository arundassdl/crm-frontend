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
import { Nunito_Sans,Roboto, Inter,Hind_Siliguri } from 'next/font/google'
const hindsilu = Hind_Siliguri({ subsets: ['latin'], weight: ['300','400','500','600','700'] })
const inter = Inter({ subsets: ['latin'], weight: ['200','300', '400', '500', '600', '700', '800', '900'] })

export type Config = {
  templateName: string
  templateDesc: string
  footerText: string
  settingsCookieName: string
  mode: Mode
  layoutPadding: number
  compactContentWidth: number
  disableRipple: boolean
  fontFamily:string
}

const themeConfig: Config = {
  templateName: 'Social DNA Labs',
  templateDesc: 'Software development company',
  footerText: 'Social DNA Labs',
  settingsCookieName: 'sdl',
  mode: 'light', // 'light', 'dark'
  layoutPadding: 10, // Common padding for header, content, footer layout components (in px)
  compactContentWidth: -1, // in px
  disableRipple: false, // true, false
  fontFamily:inter.style.fontFamily
}

export default themeConfig
