'use client'

// R59 (doc 63): a CRM page restored from the browser's back/forward cache after logout must not
// show its old content. Reloading asks the server again, which sends a signed-out visitor to sign-in.
import { useEffect } from 'react'

export default function BackNavigationGuard() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])
  return null
}
