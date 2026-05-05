import { useEffect, useLayoutEffect } from 'react'

/** `useLayoutEffect` on the client; `useEffect` on the server — avoids React SSR warnings. */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
