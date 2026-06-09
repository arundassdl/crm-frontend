/** Logical combiner between this filter row and the previous row. */
export type QuickChartFilterCondition = 'AND' | 'OR'

export type QuickChartFilterBetweenValue = {
  from: string
  to: string
}

export type QuickChartFilterValue =
  | string
  | number
  | boolean
  | string[]
  | QuickChartFilterBetweenValue
  | null
  | undefined

/** In-memory criteria row in the Quick Chart dialog. */
export type QuickChartCriteriaFilter = {
  id: number
  module: string
  fieldname: string
  label: string
  fieldtype: string
  operator: string
  value: QuickChartFilterValue
  condition: QuickChartFilterCondition
}
