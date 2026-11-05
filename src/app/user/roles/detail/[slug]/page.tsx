import { redirect } from 'next/navigation'

/** Role detail: `/settings?tab=security&subtab=roles&detail=…` */
export default async function RoleDetailRedirectPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise
  redirect(`/settings?tab=security&subtab=roles&detail=${encodeURIComponent(params.slug)}`)
}
