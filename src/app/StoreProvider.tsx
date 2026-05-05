'use client'
import { Provider } from 'react-redux'
import { store } from '@/store/store'

/**
 * Single Redux store for the whole app (same instance as `store` / thunks that import it).
 * `pages/*` and `app/*` both mount under this provider (see `RootLayout` and `pages/_app`).
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <Provider store={store}>{children}</Provider>
}