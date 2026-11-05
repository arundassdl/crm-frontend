'use client'

// newdocs/80: CRM inside CTRL — tells CTRL where it is, asks CTRL to do what a frame must not do
// itself, and (EM-6, both modes) binds each page to its organization.
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Alert, Button } from '@mui/material'

import { ctrlOrigin } from '@/lib/embed'
import {
  ORG_CHANGED_EVENT,
  installPageOrganizationBinding,
  isEmbedded,
  setEmbeddedAppearance,
  setPageOrganization,
  tellCtrl
} from '@/lib/embed-client'

const TITLES: Record<string, string> = {
  leads: 'Leads',
  deals: 'Deals',
  contacts: 'Contacts',
  accounts: 'Accounts',
  tasks: 'Tasks',
  user: 'Users',
  org: 'Home'
}

/** Mounted once, in the root layout. Standalone, it only adds EM-6's binding and its reload notice. */
export default function EmbedBridge() {
  const pathname = usePathname()
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    installPageOrganizationBinding()
    const onChanged = () => setChanged(true)
    window.addEventListener(ORG_CHANGED_EVENT, onChanged)
    if (!isEmbedded()) return () => window.removeEventListener(ORG_CHANGED_EVENT, onChanged)

    // Say "ready" until CTRL answers "hello" (CTRL may still be starting when this page loads).
    const ctrlAnswered = { done: false }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ctrlOrigin() || event.source !== window.parent) return
      if (event.data?.evoq === 1 && event.data?.type === 'hello') {
        ctrlAnswered.done = true
        // CTRL's light/dark, sent on load and again whenever CTRL's theme changes.
        setEmbeddedAppearance(event.data.appearance)
      }
    }
    window.addEventListener('message', onMessage)
    let tries = 0
    const announce = () => {
      if (ctrlAnswered.done || tries++ >= 20) return window.clearInterval(timer)
      tellCtrl({ evoq: 1, type: 'ready' })
    }
    const timer = window.setInterval(announce, 500)
    announce()

    // A frame must not navigate CTRL or leave for another site: CTRL's chooser is CTRL's to open, and
    // any other site opens in a new tab.
    const ctrl = ctrlOrigin()
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin === window.location.origin) return
      event.preventDefault()
      if (url.origin === ctrl && url.pathname.startsWith('/launch/')) tellCtrl({ evoq: 1, type: 'choose-organization' })
      else window.open(url.toString(), '_blank', 'noopener,noreferrer')
    }
    document.addEventListener('click', onClick, true)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('message', onMessage)
      window.removeEventListener(ORG_CHANGED_EVENT, onChanged)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  useEffect(() => {
    if (!isEmbedded() || !pathname) return
    const title = TITLES[pathname.split('/')[1] ?? ''] ?? 'CRM'
    tellCtrl({ evoq: 1, type: 'navigated', path: pathname, title })
  }, [pathname])

  if (!changed) return null
  return (
    <Alert
      severity='warning'
      data-testid='crm-org-changed'
      sx={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, maxWidth: 560 }}
      action={
        <Button color='inherit' size='small' onClick={() => window.location.reload()}>
          Reload
        </Button>
      }
    >
      This tab was showing another organization, which is now open in another tab or in EVOQ CTRL. Reload to continue.
    </Alert>
  )
}

/** Rendered by CrmShell: the organization this page was drawn for (EM-6). */
export function PageOrganization({ value }: { value: string | null }) {
  if (typeof window !== 'undefined') setPageOrganization(value)
  return null
}
