'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

import LayoutBuilderContainer from '@/components/layout-builder/LayoutBuilderContainer'
import ModuleListing from '@/components/Module/ModuleListing'

const ModuleDetailTabs = dynamic(() =>
  import('@/app/setup/customization/modules/[module_name]/ModuleDetailTabs').then(m => m.default)
)

/** Same shell as `UserUsersSettingsPanel` list view */
const moduleListShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--mui-palette-background-paper)] pt-[2.4rem]'

/** Same shell as `UserUsersSettingsPanel` detail view */
const moduleDetailShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--mui-palette-background-paper)] pt-[2.4rem] px-4 pb-8 sm:px-6 md:px-8'

const layoutBuilderShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--mui-palette-background-paper)] pt-[2.4rem] px-2 pb-4 sm:px-4 md:px-6'

/**
 * Modules tab: listing at `?tab=customization&subtab=modules`, module detail at `subtab=<moduleName>`,
 * layout editor (`view=layout-edit&detail=…`), or create/clone (`view=layout-create&clone_from=…`).
 * Legacy: `?tab=setup-customization-modules` without `subtab` = listing.
 */
export default function ModuleSettingsPanel() {
  const searchParams = useSearchParams()
  const topTab = searchParams?.get('tab')
  const view = searchParams?.get('view')
  const rawSubtab = searchParams?.get('subtab')
  /** Module (SDL Module Map name); legacy `detail` when no `view` */
  const subtab =
    rawSubtab ??
    (!view ? searchParams?.get('detail') : null)
  const layoutDocName = searchParams?.get('detail')
  const cloneFrom = searchParams?.get('clone_from')

  const isModuleListing =
    !view &&
    (rawSubtab === 'modules' ||
      (topTab === 'setup-customization-modules' && !rawSubtab))

  if (isModuleListing) {
    return (
      <div className={moduleListShell}>
        <ModuleListing embedInSettings />
      </div>
    )
  }

  if (view === 'layout-edit' && subtab && layoutDocName) {
    return (
      <div className={layoutBuilderShell}>
        <LayoutBuilderContainer module={subtab} layoutId={layoutDocName} embedInSettings />
      </div>
    )
  }

  if (view === 'layout-create' && subtab) {
    return (
      <div className={layoutBuilderShell}>
        <LayoutBuilderContainer
          module={subtab}
          layoutId={cloneFrom ?? undefined}
          isClone={Boolean(cloneFrom)}
          embedInSettings
        />
      </div>
    )
  }

  if (subtab) {
    return (
      <div className={moduleDetailShell}>
        <ModuleDetailTabs moduleName={subtab} embedInSettings />
      </div>
    )
  }

  return (
    <div className={moduleListShell}>
      <ModuleListing embedInSettings />
    </div>
  )
}
