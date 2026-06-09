/** Settings sidebar / `activeTab` key for Customization → Modules */
export const SETTINGS_MODULES_TAB_KEY = 'setup-customization-modules'

/** Settings sidebar / `activeTab` key for Customization → Home Page (layout listing) */
export const SETTINGS_HOME_PAGE_TAB_KEY = 'setup-customization-home-page'

/** Query `tab=` value for module settings URLs (listing: `&subtab=modules`; detail: `&subtab=<moduleName>`) */
export const SETTINGS_MODULES_URL_TAB = 'customization'

export const SETTINGS_HOME_PAGE_SUBTAB = 'home-page'

export type ModuleSettingsDetailOptions = {
  moduleName: string
  moduleTab?: 'layouts' | 'fields'
  leadConversion?: boolean
  leadConversionPicker?: boolean
}

/** `/settings?tab=customization&subtab=<module>&moduleTab=…` */
export function moduleSettingsDetailPath(options: ModuleSettingsDetailOptions): string {
  const params = new URLSearchParams()
  params.set('tab', SETTINGS_MODULES_URL_TAB)
  params.set('subtab', options.moduleName)
  if (options.moduleTab) params.set('moduleTab', options.moduleTab)
  if (options.leadConversion) params.set('leadConversion', '1')
  if (options.leadConversionPicker) params.set('leadConversionPicker', '1')
  return `/settings?${params.toString()}`
}

/** Layout editor: `detail` is the SDL Layout document name (e.g. Leads_Base Layout). */
export function moduleSettingsLayoutEditPath(moduleName: string, layoutDocName: string): string {
  const params = new URLSearchParams()
  params.set('tab', SETTINGS_MODULES_URL_TAB)
  params.set('subtab', moduleName)
  params.set('view', 'layout-edit')
  params.set('detail', layoutDocName)
  return `/settings?${params.toString()}`
}

/** New layout / clone: optional `clone_from` = source layout doc name. */
export function moduleSettingsLayoutCreatePath(moduleName: string, cloneFrom?: string): string {
  const params = new URLSearchParams()
  params.set('tab', SETTINGS_MODULES_URL_TAB)
  params.set('subtab', moduleName)
  params.set('view', 'layout-create')
  if (cloneFrom) params.set('clone_from', cloneFrom)
  return `/settings?${params.toString()}`
}

export const DASHBOARD_CREATE_VIEW = 'dashboard-create'
export const DASHBOARD_EDIT_VIEW = 'dashboard-edit'

/** Create home page: `/settings?tab=customization&subtab=home-page&view=dashboard-create` */
export function dashboardCreatePath(cloneFrom?: string): string {
  const params = new URLSearchParams()
  params.set('tab', SETTINGS_MODULES_URL_TAB)
  params.set('subtab', SETTINGS_HOME_PAGE_SUBTAB)
  params.set('view', DASHBOARD_CREATE_VIEW)
  if (cloneFrom) params.set('clone_from', cloneFrom)
  return `/settings?${params.toString()}`
}

/** Edit home page: `detail` = Insights Dashboard document name. */
export function dashboardEditPath(dashboardDocName: string): string {
  const params = new URLSearchParams()
  params.set('tab', SETTINGS_MODULES_URL_TAB)
  params.set('subtab', SETTINGS_HOME_PAGE_SUBTAB)
  params.set('view', DASHBOARD_EDIT_VIEW)
  params.set('detail', dashboardDocName)
  return `/settings?${params.toString()}`
}

/** Standalone create route (mirrors layout create pages). */
export function dashboardBuilderCreatePath(cloneFrom?: string): string {
  const base = '/dashboard-builder/new'
  if (!cloneFrom) return base
  const params = new URLSearchParams()
  params.set('clone_from', cloneFrom)
  return `${base}?${params.toString()}`
}

/** Standalone edit route. */
export function dashboardBuilderEditPath(dashboardDocName: string): string {
  return `/dashboard-builder/${encodeURIComponent(dashboardDocName)}`
}

/** @deprecated Use `dashboardCreatePath` */
export const homePageCreatePath = dashboardCreatePath

/** @deprecated Use `dashboardEditPath` */
export const homePageEditPath = dashboardEditPath
