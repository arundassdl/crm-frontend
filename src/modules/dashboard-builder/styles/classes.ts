/** Left palette width (Dashboard + Report components). */
export const DASHBOARD_SIDEBAR_WIDTH_PX = 240

export const builderShellClass =
  'flex h-[calc(100vh-4rem)] min-h-0 w-full overflow-hidden bg-slate-100 dark:bg-zinc-950'

export const sidebarClass =
  'flex h-full w-full shrink-0 flex-col bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]'

export const canvasShellClass = 'flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 dark:bg-zinc-900'

/**
 * Matches the reference widget card: glassmorphism (translucent white + backdrop blur),
 * hairline white border, soft 32px shadow, rounded-xl → rounded-2xl from `sm`.
 */
export const widgetCardClass =
  'flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-xl bg-white/60 dark:bg-[#0A0A0A] border-white/30 dark:border-[#27272A] shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-lg'

export const widgetHeaderClass =
  'flex flex-col sm:flex-row sm:items-center gap-2 border-b border-[#E3ECFC] dark:border-[#27272A] px-3 sm:px-5 py-2.5 sm:py-3.5'

export const DRAG_MIME = 'application/x-dashboard-widget'
