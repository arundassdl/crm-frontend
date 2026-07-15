'use client'

// React Imports
import { createContext, useCallback, useMemo, useState } from 'react'

// Type Imports
import type { ChildrenType } from '../types'

export type VerticalNavState = {
  width?: number
  isToggled?: boolean
  isBreakpointReached?: boolean
  transitionDuration?: number
}

export type VerticalNavContextProps = VerticalNavState & {
  updateVerticalNavState: (values: VerticalNavState) => void
  toggleVerticalNav: (value?: VerticalNavState['isToggled']) => void
}

const VerticalNavContext = createContext({} as VerticalNavContextProps)

export type VerticalNavProviderProps = ChildrenType & {
  initialToggled?: boolean
}

export const VerticalNavProvider = ({ children, initialToggled = false }: VerticalNavProviderProps) => {
  // States
  const [verticalNavState, setVerticalNavState] = useState<VerticalNavState>({
    isToggled: initialToggled
  })

  // Hooks
  const updateVerticalNavState = useCallback((values: Partial<VerticalNavState>) => {
    setVerticalNavState(prevState => ({
      ...prevState,
      ...values
    }))
  }, [])

  const toggleVerticalNav = useCallback((value?: boolean) => {
    setVerticalNavState(prevState => {
      const nextToggled = value !== undefined ? Boolean(value) : !Boolean(prevState?.isToggled)
      if (!prevState?.isBreakpointReached && typeof window !== 'undefined') {
        document.cookie = `sidebar-collapsed=${nextToggled}; path=/; max-age=31536000; SameSite=Lax`
      }
      return {
        ...prevState,
        isToggled: nextToggled
      }
    })
  }, [])

  const verticalNavProviderValue = useMemo(
    () => ({
      ...verticalNavState,
      updateVerticalNavState,
      toggleVerticalNav
    }),
    [verticalNavState, updateVerticalNavState, toggleVerticalNav]
  )

  return <VerticalNavContext.Provider value={verticalNavProviderValue}>{children}</VerticalNavContext.Provider>
}

export default VerticalNavContext
