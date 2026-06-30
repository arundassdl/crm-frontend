/** KPI-style time period options for the Compare Among = Time Period selector. */
export type TimePeriodValue =
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'Last Week'
  | 'This Month'
  | 'Last Month'
  | 'This Quarter'
  | 'Last Quarter'
  | 'This Year'
  | 'Last Year'
  | 'Last'
  | 'Custom'

export type TimePeriodLastUnit = 'day' | 'week' | 'month'

/** Alias kept so existing import sites still compile. */
export type TimePeriodType = TimePeriodValue

export const TIME_PERIOD_OPTIONS: { value: TimePeriodValue; label: string }[] = [
  { value: 'Today', label: 'Today' },
  { value: 'Yesterday', label: 'Yesterday' },
  { value: 'This Week', label: 'This Week' },
  { value: 'Last Week', label: 'Last Week' },
  { value: 'This Month', label: 'This Month' },
  { value: 'Last Month', label: 'Last Month' },
  { value: 'This Quarter', label: 'This Quarter' },
  { value: 'Last Quarter', label: 'Last Quarter' },
  { value: 'This Year', label: 'This Year' },
  { value: 'Last Year', label: 'Last Year' },
  { value: 'Last', label: 'Last' },
  { value: 'Custom', label: 'Custom' },
]
