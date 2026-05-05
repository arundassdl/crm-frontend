import type { AppProps } from 'next/app'
/**
 * Same global styles as `RootLayout`: Pages Router routes do not load `app/layout.tsx`,
 * so without these imports `--header-height`, Tailwind utilities, and icon CSS are missing on
 * `/analytics/*`.
 */
import 'react-perfect-scrollbar/dist/css/styles.css'
import '@assets/iconify-icons/generated-icons.css'
import '@/app/globals.css'
import '@configs/inter-fonts'
import { AppCacheProvider } from '@mui/material-nextjs/v14-pagesRouter'
import StoreProvider from '@/app/StoreProvider'
import AnalyticsPagesAppShell from '@/components/analytics/AnalyticsPagesAppShell'
import { ClientDashboardProviders } from '@/components/analytics/ClientDashboardProviders'

/**
 * `src/pages/analytics/*` — Module Federation routes use the same vertical shell as `(dashboard)/layout`
 * via `AnalyticsPagesAppShell` (Navbar + Navigation + Footer).
 * MUI/Emotion require `AppCacheProvider` (Pages Router).
 */
export default function AnalyticsPagesApp({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <StoreProvider>
        <ClientDashboardProviders direction="ltr">
          <AnalyticsPagesAppShell>
            <Component {...pageProps} />
          </AnalyticsPagesAppShell>
        </ClientDashboardProviders>
      </StoreProvider>
    </AppCacheProvider>
  )
}
