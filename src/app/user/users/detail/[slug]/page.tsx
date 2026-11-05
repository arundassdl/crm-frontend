import { redirect } from 'next/navigation'

/** User detail now lives under Settings: `/settings?tab=general&subtab=users&detail=…` */
export default async function UserDetailRedirectPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise
  redirect(`/settings?tab=general&subtab=users&detail=${encodeURIComponent(params.slug)}`)
}
