'use client'

import type { ReactNode } from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'

/** App Router (`src/app/`) MUI + Emotion cache. Do not use under `src/pages/`. */
export default function MuiAppRouterCache({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ prepend: true }}>{children}</AppRouterCacheProvider>
  )
}
