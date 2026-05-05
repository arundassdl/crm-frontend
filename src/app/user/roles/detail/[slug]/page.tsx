import { redirect } from 'next/navigation'

/** Role detail: `/settings?tab=security&subtab=roles&detail=…` */
export default function RoleDetailRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/settings?tab=security&subtab=roles&detail=${encodeURIComponent(params.slug)}`)
}
