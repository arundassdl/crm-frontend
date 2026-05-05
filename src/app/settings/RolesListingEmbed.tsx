'use client'

import RoleListing from '@/components/roles/Listing'

type RolesListingEmbedProps = {
  /** Current `detail` query (selected role) — for highlight in tree/list. */
  settingsDetailKey?: string
}

export default function RolesListingEmbed({
  settingsDetailKey = '',
}: RolesListingEmbedProps) {
  return (
    <RoleListing embedInSettings settingsDetailKey={settingsDetailKey} />
  )
}
