import { NextResponse } from 'next/server'

import { getDashboardFromStore, saveDashboardToStore } from '@/modules/dashboard-builder/api/serverStore'
import type { RemoveWidgetPayload } from '@/modules/dashboard-builder/types'

export async function DELETE(request: Request) {
  const body = (await request.json()) as RemoveWidgetPayload
  const existing = getDashboardFromStore(body.dashboardId)

  const saved = saveDashboardToStore({
    ...existing,
    widgets: existing.widgets.filter(w => w.id !== body.widgetId),
    layouts: {
      ...existing.layouts,
      lg: existing.layouts.lg.filter(item => item.i !== body.widgetId),
    },
  })

  return NextResponse.json(saved)
}
