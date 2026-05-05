import type { GetServerSideProps } from 'next'

/**
 * Host route: `/analytics` → see `dashboard/index` for the main remote surface.
 */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/analytics/dashboard', permanent: false },
})

export default function AnalyticsIndex() {
  return null
}
