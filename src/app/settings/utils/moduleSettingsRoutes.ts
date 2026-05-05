/** Settings sidebar / `activeTab` key for Customization → Modules */
export const SETTINGS_MODULES_TAB_KEY = 'setup-customization-modules'

/** Query `tab=` value for module settings URLs (listing: `&subtab=modules`; detail: `&subtab=<moduleName>`) */
export const SETTINGS_MODULES_URL_TAB = 'customization'

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
