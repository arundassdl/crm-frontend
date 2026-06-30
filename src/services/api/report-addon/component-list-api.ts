import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

export type ComponentListRow = {
  name: string
  title: string
  chart_type?: string | null
  /** Growth Index KPI comparison settings (present when chart_type is `Growth Index KPI`). */
  compare_to?: string | null
  objective?: string | null
  /** Ranking KPI settings (present when chart_type is `Rankings KPI`). */
  rank_field?: string | null
  show?: string | null
  display_record_count?: boolean | null
  shortened?: boolean | null
  format?: string | null
  decimal_places?: number | null
  measures_to_format?: string[] | null
  /** Comparator settings (present when chart_type identifies a Comparator report). */
  comparator_style?: string | null
  compare_among?: string | null
  compare_among_label?: string | null
  user_type?: string | null
  selected_users?: string[] | null
  selected_user_labels?: string[] | null
  selected_roles?: string[] | null
  selected_role_labels?: string[] | null
  period_type?: string | null
  period_last_value?: number | null
  period_last_unit?: string | null
  period_from_date?: string | null
  period_to_date?: string | null
  picklist_module?: string | null
  picklist_module_label?: string | null
  picklist_field?: string | null
  picklist_field_label?: string | null
  comparison_parameters?: unknown[] | null
}

export type ComponentListResult = {
  data: ComponentListRow[]
  total: number
  start: number
  page_length: number
  has_more: boolean
}

export type FetchComponentListParams = {
  collection?: string
  is_report?: number
  start?: number
  page_length?: number
}

const COMPONENT_LIST_METHOD = '/api/method/report_addon.api.report.get_component_list'
const COLLECTION_METHOD = '/api/method/report_addon.api.report.get_collection'

export type ReportCollectionOption = {
  value: string
  label: string
}

const DEFAULT_REPORT_COLLECTIONS: ReportCollectionOption[] = [
  { value: 'all', label: 'All Reports' },
]

type CollectionRow = {
  name?: string
  title?: string
  value?: string
  label?: string
  collection?: string
}

function normalizeCollectionRows(message: unknown): CollectionRow[] {
  if (!message || typeof message !== 'object') return []
  const m = message as Record<string, unknown>
  if (Array.isArray(m.data)) return m.data as CollectionRow[]
  if (Array.isArray(m.collections)) return m.collections as CollectionRow[]
  if (Array.isArray(message)) return message as CollectionRow[]
  return []
}

function mapCollectionRow(row: CollectionRow): ReportCollectionOption {
  const value = String(row.value ?? row.name ?? row.collection ?? 'all')
  const label = String(row.label ?? row.title ?? row.name ?? value)
  return { value, label }
}

/** Report collections for the sidebar dropdown. */
export async function fetchReportCollections(token: string): Promise<ReportCollectionOption[]> {
  const url = `${CONSTANTS.API_BASE_URL}${COLLECTION_METHOD}`
  try {
    const res = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )
    const raw = normalizeCollectionRows(res?.data?.message)
    if (raw.length > 0) {
      return raw.map(mapCollectionRow)
    }
  } catch (error) {
    console.error('fetchReportCollections', error)
  }
  return DEFAULT_REPORT_COLLECTIONS
}

/** Dashboard / report component picklist with pagination. */
export async function fetchComponentList(
  token: string,
  params: FetchComponentListParams = {}
): Promise<ComponentListResult> {
  const url = `${CONSTANTS.API_BASE_URL}${COMPONENT_LIST_METHOD}`
  const body = {
    collection: params.collection ?? 'all',
    is_report: params.is_report ?? 0,
    start: params.start ?? 0,
    page_length: params.page_length ?? 20,
  }

  const res = await axios.post(url, body, {
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })

  const message = res?.data?.message ?? {}
  const data = Array.isArray(message.data) ? message.data : []

  return {
    data: data.map(
      (row: {
        name?: string
        title?: string
        chart_type?: string
        compare_to?: string
        objective?: string
        rank_field?: string
        show?: string
        display_record_count?: boolean
        shortened?: boolean
        format?: string
        decimal_places?: number
        measures_to_format?: string[]
        comparator_style?: string
        compare_among?: string
        compare_among_label?: string
        user_type?: string
        selected_users?: string[]
        selected_user_labels?: string[]
        selected_roles?: string[]
        selected_role_labels?: string[]
        period_type?: string
        picklist_module?: string
        picklist_module_label?: string
        picklist_field?: string
        picklist_field_label?: string
        comparison_parameters?: unknown[]
      }) => ({
        name: String(row?.name ?? ''),
        title: String(row?.title ?? row?.name ?? ''),
        chart_type: row?.chart_type != null ? String(row.chart_type) : undefined,
        compare_to: row?.compare_to != null ? String(row.compare_to) : undefined,
        objective: row?.objective != null ? String(row.objective) : undefined,
        rank_field: row?.rank_field != null ? String(row.rank_field) : undefined,
        show: row?.show != null ? String(row.show) : undefined,
        display_record_count: row?.display_record_count != null ? Boolean(row.display_record_count) : undefined,
        shortened: row?.shortened != null ? Boolean(row.shortened) : undefined,
        format: row?.format != null ? String(row.format) : undefined,
        decimal_places: row?.decimal_places != null ? Number(row.decimal_places) : undefined,
        measures_to_format: Array.isArray(row?.measures_to_format) ? row.measures_to_format : undefined,
        comparator_style: row?.comparator_style != null ? String(row.comparator_style) : undefined,
        compare_among: row?.compare_among != null ? String(row.compare_among) : undefined,
        compare_among_label: row?.compare_among_label != null ? String(row.compare_among_label) : undefined,
        user_type: row?.user_type != null ? String(row.user_type) : undefined,
        selected_users: Array.isArray(row?.selected_users) ? row.selected_users : undefined,
        selected_user_labels: Array.isArray(row?.selected_user_labels) ? row.selected_user_labels : undefined,
        selected_roles: Array.isArray(row?.selected_roles) ? row.selected_roles : undefined,
        selected_role_labels: Array.isArray(row?.selected_role_labels) ? row.selected_role_labels : undefined,
        period_type: row?.period_type != null ? String(row.period_type) : undefined,
        picklist_module: row?.picklist_module != null ? String(row.picklist_module) : undefined,
        picklist_module_label: row?.picklist_module_label != null ? String(row.picklist_module_label) : undefined,
        picklist_field: row?.picklist_field != null ? String(row.picklist_field) : undefined,
        picklist_field_label: row?.picklist_field_label != null ? String(row.picklist_field_label) : undefined,
        comparison_parameters: Array.isArray(row?.comparison_parameters) ? row.comparison_parameters : undefined,
      })
    ),
    total: Number(message.total ?? data.length),
    start: Number(message.start ?? body.start),
    page_length: Number(message.page_length ?? body.page_length),
    has_more: Boolean(message.has_more),
  }
}
