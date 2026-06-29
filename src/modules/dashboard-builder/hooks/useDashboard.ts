import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addDashboardWidget,
  fetchDashboard,
  fetchDashboardList,
  removeDashboardWidget,
  saveDashboardLayout,
} from '../api/dashboardApi'
import type { AddWidgetPayload, RemoveWidgetPayload, SaveLayoutPayload } from '../types'
import {
  readAccessTokenDataParsed,
  readAccessTokenString,
  readRoleProfileFromStorage,
} from '@/utils/accessTokenDataStorage'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  list: (roleProfile: string) => [...dashboardKeys.all, 'list', roleProfile] as const,
  detail: (id: string) => [...dashboardKeys.all, id] as const,
}

export function useDashboardListQuery(roleProfile?: string) {
  const tokenData = readAccessTokenDataParsed<{ username?: string }>()
  const resolvedRoleProfile = roleProfile ?? readRoleProfileFromStorage()
  const username = typeof tokenData.username === 'string' ? tokenData.username : ''
  const token = readAccessTokenString()

  return useQuery({
    queryKey: dashboardKeys.list(`${resolvedRoleProfile}:${username}`),
    queryFn: () =>
      fetchDashboardList({
        roleProfile: resolvedRoleProfile,
        username,
        token,
      }),
    enabled: Boolean(token),
  })
}

export function useDashboardQuery(dashboardId: string | null) {
  const token = readAccessTokenString()

  return useQuery({
    queryKey: dashboardId ? dashboardKeys.detail(dashboardId) : dashboardKeys.all,
    queryFn: () => fetchDashboard(dashboardId!, token),
    enabled: Boolean(dashboardId),
  })
}

export function useSaveLayoutMutation() {
  const qc = useQueryClient()
  const token = readAccessTokenString()

  return useMutation({
    mutationFn: (payload: SaveLayoutPayload) => saveDashboardLayout(payload, { token }),
    onSuccess: data => {
      qc.setQueryData(dashboardKeys.detail(data.id), data)
    },
  })
}

export function useAddWidgetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddWidgetPayload) => addDashboardWidget(payload),
    onSuccess: data => {
      qc.setQueryData(dashboardKeys.detail(data.id), data)
    },
  })
}

export function useRemoveWidgetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RemoveWidgetPayload) => removeDashboardWidget(payload),
    onSuccess: data => {
      qc.setQueryData(dashboardKeys.detail(data.id), data)
    },
  })
}
