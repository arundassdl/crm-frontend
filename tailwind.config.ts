import type { Config } from 'tailwindcss'

const config: Config = {
  /**
   * CRM utilities are scoped under `#__next` (see `src/app/RootLayout.tsx` on `<html>`).
   */
  content: ['./src/**/*.{js,ts,jsx,tsx,css}'],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [require('tailwindcss-logical'), require('./src/@core/tailwind/plugin')],
  theme: {
    extend: {}
  }
}

export default config
