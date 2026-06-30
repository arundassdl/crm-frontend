'use client'

import type { TimePeriodResultData } from '../../utils/transformComparatorResult'

type Props = {
  data: TimePeriodResultData
}

export function TimePeriodPivotTable({ data }: Props) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-xs">
          <thead>
            <tr>
              <th
                className="pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-tight text-slate-400"
                scope="col"
              >
                Metric
              </th>
              <th
                className="pb-2.5 px-3 text-right text-xs font-semibold text-slate-700"
                scope="col"
              >
                {data.periodLabel || 'Period'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map(row => (
              <tr key={row.name}>
                <th
                  scope="row"
                  className="py-2.5 pr-4 text-left text-xs font-medium text-slate-500"
                >
                  {row.name}
                </th>
                <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
