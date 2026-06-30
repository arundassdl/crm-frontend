/**
 * "Display Component Filters" — up to 2 dashboard runtime filter fields configured
 * per KPI widget, sourced from the widget's selected module + related module.
 *
 * These are stored only in the widget configuration (`component_filters`) and are
 * never written into the saved Insights Query / report JSON or generated SQL.
 */
export type ComponentFilterFieldConfig = {
  /** Field name (column) used as `runtime_filters[].fieldname` when calling insights-query-result. */
  fieldname: string
  /** Field label, e.g. "Stage". */
  label: string
  /** Module display label, e.g. "Deals". */
  module: string
  /** Internal module value, used to resolve picklist values for the filter dropdown. */
  moduleValue: string
  fieldtype: string
  frontendFieldtype?: string
  /** Newline-separated static Select options, when applicable. */
  options?: string
  layoutName?: string
  picklistModule?: string
  /** Link target doctype, e.g. "User" — used for the User Selector value control. */
  linkDoctype?: string
}

/**
 * A single dashboard runtime filter row, e.g. `{ fieldname: "stage", operator: "is", value: "Closed Won" }`.
 * Sent to `insights-query-result` as `runtime_filters` for that request only — never
 * persisted into the Insights Query or the widget configuration.
 */
export type RuntimeFilterRow = {
  fieldname: string
  operator: string
  value: string
  /** Second value for the "between" operator. */
  valueTo?: string
}
