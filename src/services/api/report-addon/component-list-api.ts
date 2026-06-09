import axios from 'axios'

import { CONSTANTS } from '@/services/config/app-config'

export type ComponentListRow = {
  name: string
  title: string
  chart_type?: string | null
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
    data: data.map((row: { name?: string; title?: string; chart_type?: string }) => ({
      name: String(row?.name ?? ''),
      title: String(row?.title ?? row?.name ?? ''),
      chart_type: row?.chart_type != null ? String(row.chart_type) : undefined,
    })),
    total: Number(message.total ?? data.length),
    start: Number(message.start ?? body.start),
    page_length: Number(message.page_length ?? body.page_length),
    has_more: Boolean(message.has_more),
  }
}
