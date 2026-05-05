'use client'

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

export type ClickContextValue = {
  isClicked: boolean
  setIsClicked: Dispatch<SetStateAction<boolean>>
  profileImage: string
  setProfileImage: Dispatch<SetStateAction<string>>
}

const noopBool: Dispatch<SetStateAction<boolean>> = () => {}
const noopStr: Dispatch<SetStateAction<string>> = () => {}

/** Safe default when a consumer renders outside `ClickProvider` (e.g. mixed App/Pages trees). */
const defaultClickContext: ClickContextValue = {
  isClicked: true,
  setIsClicked: noopBool,
  profileImage: '/images/avatars/5.png',
  setProfileImage: noopStr,
}

const ClickContext = createContext<ClickContextValue>(defaultClickContext)

export const useClickContext = () => useContext(ClickContext)

export const ClickProvider = ({ children }: { children: ReactNode }) => {
  const [isClicked, setIsClicked] = useState(true)
  const [profileImage, setProfileImage] = useState('/images/avatars/5.png')

  return (
    <ClickContext.Provider
      value={{ isClicked, setIsClicked, profileImage, setProfileImage }}
    >
      {children}
    </ClickContext.Provider>
  )
}
