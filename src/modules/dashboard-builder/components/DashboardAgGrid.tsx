'use client'

import { CSSProperties } from 'react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import type { AgGridReactProps } from 'ag-grid-react'
import { AgGridReact } from 'ag-grid-react'

let modulesRegistered = false

function ensureAgGridModules(): void {
  if (modulesRegistered || typeof window === 'undefined') return
  ModuleRegistry.registerModules([AllCommunityModule])
  modulesRegistered = true
}

if (typeof window !== 'undefined') {
  ensureAgGridModules()
}

type DashboardAgGridProps = AgGridReactProps & {
  minHeight?: number
  style?: CSSProperties
}

/**
 * AG Grid v33+ requires registered modules before render; without this the grid is blank.
 */
export function DashboardAgGrid({ minHeight = 160, style, ...gridProps }: DashboardAgGridProps) {
  if (typeof window === 'undefined') {
    return (
      <div
        className="animate-pulse rounded bg-slate-50"
        style={{ minHeight, height: '100%', width: '100%' }}
      />
    )
  }

  ensureAgGridModules()

  return (
    <div style={{ height: '100%', width: '100%', minHeight, ...style }}>
      <AgGridReact {...gridProps} />
    </div>
  )
}
