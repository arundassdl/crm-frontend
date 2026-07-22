'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

import LayoutBuilderContainer from '@/components/layout-builder/LayoutBuilderContainer'
import HomePageListing from '@/components/HomePage/HomePageListing'
import ModuleListing from '@/components/Module/ModuleListing'

import HomePageBuilderHost from './HomePageBuilderHost'

const ModuleDetailTabs = dynamic(() =>
  import('@/app/setup/customization/modules/[module_name]/ModuleDetailTabs').then(m => m.default)
)

/** Modules & Fields listing: full-height white column so ModuleListing (its own toolbar/table) matches the reference. */
const moduleListShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]'

/** Customization Home Page: Insights Dashboard listing (full-height white, matches reference) */
const homePageShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]'

/** Same shell as `UserUsersSettingsPanel` detail view */
const moduleDetailShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-[#EFF6FF] dark:bg-[#0A0A0A]'

const layoutBuilderShell =
  'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#EFF6FF]  dark:bg-[#0A0A0A] '

const CUSTOMIZATION_HOME_SUBTAB = 'home-page'
const CUSTOMIZATION_MODULES_SUBTAB = 'modules'
const DASHBOARD_CREATE_VIEW = 'dashboard-create'
const DASHBOARD_EDIT_VIEW = 'dashboard-edit'
const LEGACY_HOME_CREATE_VIEW = 'home-create'
const LEGACY_HOME_EDIT_VIEW = 'home-edit'

/** Reserved customization subtabs — not SDL Module Map names. */
function isReservedCustomizationSubtab(sub: string | null | undefined): boolean {
  const s = (sub ?? '').trim().toLowerCase()
  return s === CUSTOMIZATION_HOME_SUBTAB || s === CUSTOMIZATION_MODULES_SUBTAB
}

/**
 * Customization settings: home page at `?tab=customization&subtab=home-page`, modules at
 * `subtab=modules`, module detail at `subtab=<moduleName>`, layout editor (`view=layout-edit&detail=…`),
 * create/clone (`view=layout-create&clone_from=…`), or home page builder
 * (`subtab=home-page&view=dashboard-create` / `view=dashboard-edit&detail=…`).
 * Legacy: `?tab=setup-customization-modules` without `subtab` = modules listing.
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

  const isHomePage =
    !view &&
    (rawSubtab === CUSTOMIZATION_HOME_SUBTAB ||
      topTab === 'setup-customization-home-page')

  const isDashboardEdit =
    (view === DASHBOARD_EDIT_VIEW || view === LEGACY_HOME_EDIT_VIEW) && layoutDocName
  const isDashboardCreate =
    (view === DASHBOARD_CREATE_VIEW || view === LEGACY_HOME_CREATE_VIEW) &&
    rawSubtab === CUSTOMIZATION_HOME_SUBTAB

  if (isDashboardEdit) {
    return (
      <div className={layoutBuilderShell}>
        <HomePageBuilderHost dashboardId={layoutDocName} embedInSettings />
      </div>
    )
  }

  if (isDashboardCreate) {
    return (
      <div className={layoutBuilderShell}>
        <HomePageBuilderHost
          dashboardId="new"
          cloneFrom={cloneFrom}
          embedInSettings
        />
      </div>
    )
  }

  const isModuleListing =
    !view &&
    (rawSubtab === CUSTOMIZATION_MODULES_SUBTAB ||
      (topTab === 'setup-customization-modules' && !rawSubtab))

  if (isHomePage) {
    return (
      <div className={homePageShell}>
        <HomePageListing embedInSettings />
      </div>
    )
  }

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

  if (subtab && !isReservedCustomizationSubtab(subtab)) {
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
