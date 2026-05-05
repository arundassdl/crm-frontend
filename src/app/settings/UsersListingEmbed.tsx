'use client'

import UsersListing from '@/components/Users/Users/Listing'

type UsersListingEmbedProps = {
  /** Current `detail` query value (selected user id) — passed from panel so the list need not call `useSearchParams`. */
  settingsDetailKey?: string
}

/** Settings tab: pass layout props so the grid fills the panel and aligns with the sidebar. */
export default function UsersListingEmbed({ settingsDetailKey = '' }: UsersListingEmbedProps) {
  return <UsersListing embedInSettings settingsDetailKey={settingsDetailKey} />
}
