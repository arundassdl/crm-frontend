export type ComparatorDurationUnit = 'day' | 'week' | 'month'

/** A single "Comparison Parameter" row in the Comparator Builder. */
export type ComparatorParameter = {
  id: string
  parameter_name: string

  /** Metric Module */
  module: string
  module_label: string

  /** Related Module — optional module linked to `module`; when set, Measure is scoped to it instead. */
  related_module?: string
  related_module_label?: string

  /** Measure — an `AggregateOption` id scoped to `related_module || module` (e.g. "deals::amount::sum"). */
  measure: string
  measure_label: string

  /** Criteria Filter — single condition. */
  criteria_field?: string
  criteria_field_label?: string
  criteria_operator?: string
  criteria_value?: string

  /** Comparison Based On — ownership field for this parameter's module. */
  comparison_based_on?: string
  comparison_based_on_label?: string

  /** Duration — same shape as the KPI Scorecard duration configuration. */
  duration_field?: string
  duration_value?: string
  duration_last_value?: number | ''
  duration_last_unit?: ComparatorDurationUnit
  duration_from_date?: string
  duration_to_date?: string

  /** Trend Up/Down — whether an increasing value is a positive trend (controls arrow color). */
  trend_up_is_positive?: boolean

  /** Associated Date Field — the date/datetime field used to filter records against the Compare Among Time Period. */
  associated_date_field?: string
  associated_date_field_label?: string
}
