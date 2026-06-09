import { NextResponse } from 'next/server'

import { getDashboardFromStore, saveDashboardToStore } from '@/modules/dashboard-builder/api/serverStore'
import type { AddWidgetPayload } from '@/modules/dashboard-builder/types'

export async function POST(request: Request) {
  const body = (await request.json()) as AddWidgetPayload
  const existing = getDashboardFromStore(body.dashboardId)

  const saved = saveDashboardToStore({
    ...existing,
    widgets: [...existing.widgets, body.widget],
    layouts: {
      ...existing.layouts,
      lg: [...existing.layouts.lg, body.layoutItem],
    },
  })

  return NextResponse.json(saved)
}
