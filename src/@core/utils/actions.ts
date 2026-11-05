'use server'

import { cookies } from 'next/headers'
import themeConfig from '@configs/themeConfig'

const USER_PREFERENCE_COOKIES = new Set([themeConfig.settingsCookieName, 'sidebar-collapsed'])

export async function deleteCookie(data: { name?: string }) {
  if (!data.name || !USER_PREFERENCE_COOKIES.has(data.name)) {
    throw new Error('Unsupported preference cookie')
  }

  const cookieStore = await cookies()
  cookieStore.delete(data.name)
}
