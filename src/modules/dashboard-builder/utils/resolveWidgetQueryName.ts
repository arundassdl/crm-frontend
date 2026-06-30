import type { DashboardWidget } from '../types'
import { isTemporaryComponentId } from './componentIdUtils'
import { findCatalogItem, getApiCatalogItems } from './widgetCatalog'

export { isInsightsQueryDocName, isTemporaryComponentId } from './componentIdUtils'

function pickQueryName(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    const trimmed = candidate.trim()
    if (!trimmed || isTemporaryComponentId(trimmed)) continue
    return trimmed
  }
  return null
}

type WidgetQueryNameFields = {
  config?: Record<string, unknown> | null
  properties?: Record<string, unknown> | null
  catalogId?: string | null
  name?: unknown
  queryName?: unknown
  reportName?: unknown
  savedReportName?: unknown
}

export function resolveWidgetQueryNameFromFields(fields: WidgetQueryNameFields): string | null {
  const { config, properties, catalogId, name, queryName, reportName, savedReportName } = fields

  return pickQueryName(
    config?.queryName,
    config?.savedReportName,
    config?.reportName,
    savedReportName,
    queryName,
    reportName,
    properties?.query,
    properties?.queryName,
    properties?.name,
    name,
    catalogId
  )
}

export function resolveWidgetQueryNameFromRaw(widget: Record<string, unknown>): string | null {
  const properties = widget.properties as Record<string, unknown> | undefined
  const config = widget.config as Record<string, unknown> | undefined

  return resolveWidgetQueryNameFromFields({
    config,
    properties,
    catalogId: typeof widget.catalogId === 'string' ? widget.catalogId : undefined,
    name: widget.name,
    queryName: widget.queryName ?? widget.query_name,
    reportName: widget.report_name ?? widget.reportName,
    savedReportName: widget.savedReportName ?? widget.saved_report_name,
  })
}

export function resolveWidgetQueryName(widget: DashboardWidget): string | null {
  const properties = widget.properties as Record<string, unknown> | undefined
  const config = widget.config as Record<string, unknown> | undefined
  const raw = widget as DashboardWidget & { name?: unknown }

  const direct = resolveWidgetQueryNameFromFields({
    config,
    properties,
    catalogId: widget.catalogId,
    name: raw.name,
  })

  if (direct) return direct

  if (widget.catalogId) {
    const byId = findCatalogItem(widget.catalogId)
    if (byId && !isTemporaryComponentId(byId.id)) {
      const fromCatalog = pickQueryName(
        byId.config?.queryName,
        byId.config?.savedReportName,
        byId.config?.reportName,
        byId.id
      )
      if (fromCatalog) return fromCatalog
    }
  }

  const normalizedTitle = widget.title.trim().toLowerCase()
  if (normalizedTitle) {
    for (const item of getApiCatalogItems()) {
      if (item.title.trim().toLowerCase() !== normalizedTitle) continue
      if (item.type !== widget.type) continue
      if (isTemporaryComponentId(item.id)) continue
      const fromCatalog = pickQueryName(
        item.config?.queryName,
        item.config?.savedReportName,
        item.config?.reportName,
        item.id
      )
      if (fromCatalog) return fromCatalog
    }
  }

  return null
}
