import type { DashboardWidget, WidgetProperties } from '../types'

/** Config fields flattened into `properties` for backend round-trip (see `save_dashboard` items.options). */
const PERSISTED_CONFIG_KEYS = [
  'kpiStyle',
  'chartType',
  'chart_type',
  'componentKind',
  'queryName',
  'savedReportName',
  'reportName',
  'chartSource',
  'quickChart',
  'aggregateColumns',
  'groupingColumn',
  'measureIds',
  'groupingId',
  'value',
  'isReport',
  'compare_to',
  'objective',
  'component_type',
  'component_name',
  'query_id',
  'rank_field',
  'show',
  'display_record_count',
  'shortened',
  'format',
  'decimal_places',
  'measures_to_format',
  'display_component_filters',
  'component_filters',
] as const

export function configToPersistedProperties(
  config?: Record<string, unknown>
): Record<string, unknown> {
  if (!config) return {}
  const out: Record<string, unknown> = {}
  for (const key of PERSISTED_CONFIG_KEYS) {
    const value = config[key]
    if (value !== undefined && value !== null) {
      out[key] = value
    }
  }
  return out
}

export function configFromPersistedProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  for (const key of PERSISTED_CONFIG_KEYS) {
    const value = properties[key]
    if (value !== undefined && value !== null) {
      config[key] = value
    }
  }
  return config
}

export function buildWidgetPropertiesForSave(
  widget: DashboardWidget,
  queryName: string | null
): WidgetProperties {
  return {
    ...widget.properties,
    ...configToPersistedProperties(widget.config),
    ...(queryName ? { query: queryName, queryName, name: queryName } : {}),
  }
}

export function mergeWidgetConfig(
  local: DashboardWidget,
  remote: DashboardWidget
): DashboardWidget {
  return {
    ...local,
    ...remote,
    config: {
      ...configFromPersistedProperties((remote.properties ?? {}) as Record<string, unknown>),
      ...local.config,
      ...remote.config,
    },
    properties: {
      ...local.properties,
      ...remote.properties,
    },
  }
}

export function mergeWidgetsAfterSave(
  localWidgets: DashboardWidget[],
  remoteWidgets: DashboardWidget[]
): DashboardWidget[] {
  if (!remoteWidgets.length) return localWidgets
  if (!localWidgets.length) return remoteWidgets

  const remoteById = new Map(remoteWidgets.map(widget => [widget.id, widget]))

  return localWidgets.map(localWidget => {
    const remoteWidget = remoteById.get(localWidget.id)
    if (!remoteWidget) return localWidget
    return mergeWidgetConfig(localWidget, remoteWidget)
  })
}
