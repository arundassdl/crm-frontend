/** Left palette width (Dashboard + Report components). */
export const DASHBOARD_SIDEBAR_WIDTH_PX = 240

export const builderShellClass =
  'flex h-[calc(100vh-4rem)] min-h-0 w-full overflow-hidden bg-slate-100 dark:bg-zinc-950'

export const sidebarClass =
  'flex h-full w-full shrink-0 flex-col bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]'

export const canvasShellClass = 'flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 dark:bg-zinc-900'

export const widgetCardClass =
  'flex h-full flex-col overflow-hidden rounded-2xl border bg-white dark:bg-[#18181B] border-[#E3ECFC] dark:border-[#27272A] shadow-[0_6px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)] hover:-translate-y-0.5'

export const widgetHeaderClass =
  'flex items-center gap-2 border-b border-[#E3ECFC] dark:border-[#27272A] px-4 py-3'

export const DRAG_MIME = 'application/x-dashboard-widget'
