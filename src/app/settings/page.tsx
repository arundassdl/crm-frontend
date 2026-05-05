import { Suspense } from 'react'

import SettingsPageClient from './SettingsPageClient'

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center p-6 text-gray-500">
          Loading...
        </div>
      }
    >
      <SettingsPageClient />
    </Suspense>
  )
}
