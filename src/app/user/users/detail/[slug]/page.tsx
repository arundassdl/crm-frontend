import { redirect } from 'next/navigation'

/** User detail now lives under Settings: `/settings?tab=general&subtab=users&detail=…` */
export default function UserDetailRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/settings?tab=general&subtab=users&detail=${encodeURIComponent(params.slug)}`)
}
