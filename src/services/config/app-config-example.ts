import {
  ANALYTICS_APP_URL_PUBLIC_HOST_DEFAULT,
  ANALYTICS_MF_ALTERNATE_IDS,
  ANALYTICS_MF_LEGACY_PRIMARY,
  ANALYTICS_MF_REMOTE_NAME,
  ANALYTICS_MF_ROUTE_MODULES,
} from '@/config/microfrontends/analytics'
import {
  REPORTS_MF_REMOTE_NAME,
  REPORTS_APP_URL_PUBLIC_HOST_DEFAULT,
} from '@/config/microfrontends/reports'

let ENV = 'DEV';

/**
 * `CONSTANTS` holds CRM-wide settings. For Module Federation, **connection** defaults (URL, remote
 * name) live here; **per-screen module ids** for analytics are in `config/microfrontends/analytics.ts`
 * and re-exported below for convenience. A new micro-app can use its own file there without growing
 * this object for every page — or pass the id directly in a route: `createFederatedClientComponent('addon/Home')`.
 */
export const CONSTANTS = {
  API_BASE_URL:
    ENV === 'PROD' ? '' : 'http://crmappv1.local:8000',
  // ENV === 'PROD' ? '' : 'https://crmapp.socialdnalabs.com',
  API_MANDATE_PARAMS: '/api/method/sdl_user_management.sdk.api',
  API_FSM_MANDATE_PARAMS: '/api/method/sdl_fsm.sdk.api',
  API_MANDATE_FRAPPE_PARAMS: '/api/method',
  APPCODE: 'CRM',
  VERSION: 'v1',
  ENABLE_APPLY_COUPON_CODE: true,
  ENABLE_STORE_CREDIT: true,
  ENABLE_REDIRECT_FEATURE: true,
  ENABLE_PRODUCT_ENQUIRY_FEATURE: false,
  USE_SINGLE_ENQUIRY: false,
  USE_MULTI_ENQUIRY: false,
  DISPLAY_PRODUCT_PRICE_ON_PRODUCT_LISTING_CARD: true,
  DISPLAY_ADD_CART_BUTTON_ON_PRODUCT_LISTING_CARD: true,
  DISPLAY_ADD_CATALOG_BUTTON_ON_PRODUCT_LISTING_CARD: false,
  DISPLAY_WISHLIST_ICON_ON_PRODUCT_LISTING_CARD: true,
  DISPLAY_WISHLIST_ICON_ON_WEBNAVBAR: true,
  DISPLAY_CART_ON_WEBNAVBAR: true,
  DOES_PRODUCT_HAS_VARIANTS: false,
  MAX_CARDS_PER_ROW_LISTING_PAGE: 2,
  DISPLAY_TAG_ON_PRODUCT_LISTING_CARD: true,
  DOMAIN_NAME: '',
  // "SHOW_MORE_ITEMS" IS A KEY WHOSE VALUE DECIDES WHETHER TO SHOW LOAD MORE BUTTON OR PAGINATION.
  // IT WILL CONTAIN TWO VALUES "paginate" or "load-more"
  ENABLE_MISSING_PARTS: true,
  ENABLE_PAGINATION: true,
  ENABLE_LOAD_MORE: false,
  SHOW_MORE_ITEMS: 'paginate',
  SHOW_FUTURE_STOCK_AVAILABILITY_TO_GUEST: true,
  ADD_TO_CART_FOR_GUEST: true,
  ALLOW_PAYMENT_GATEWAY: true,
  SHOW_TRANSPORTERS_LIST_TO_DEALER: true,
  ALLOW_REQUEST_QUOTATION: true,
  // "PRODUCT_LISTING_VIEW" IS A KEY WHOSE VALUE DECIDES WHETHER TO SHOW CARD VIEW OF LIST VIEW ON PRODUCT LISTING PAGE.
  // IT WILL CONTAIN TWO VALUES "list-view" or "grid-view"
  ENABLE_TOGGLE_PRODUCT_LISTING_VIEW: true,
  PRODUCT_LISTING_VIEW: 'grid-view',
  ENABLE_META_TAGS: true,
  ENABLE_SEARCH_TEXT: false,
  ENABLE_PAYMENT_INTEGRATION: false,
  DEFAULT_CURRENCY_VALUE: 'rupee',
  DEFAULT_LANGUAGE: 'en',
  ENABLE_SHOP_ON_AMAZON: false,
  /**
   * Base URL of the analytics MF app (see `app-config.ts`). Production default includes `/analytics` path.
   */
  ANALYTICS_APP_URL:
    process.env.NEXT_PUBLIC_ANALYTICS_APP_URL ??
    (process.env.NODE_ENV === 'production'
      ? ANALYTICS_APP_URL_PUBLIC_HOST_DEFAULT
      : 'http://localhost:3012'),
  /** Must match the remote `name: '…'` in ModuleFederationPlugin (see `ANALYTICS_MF_REMOTE_NAME` in microfrontends config). */
  ANALYTICS_MF_REMOTE_NAME,
  /** Base URL of the reports MF app (origin + Next `basePath`) — mirror `app-config.ts`. */
  REPORTS_APP_URL:
    process.env.NEXT_PUBLIC_REPORTS_APP_URL ??
    (process.env.NODE_ENV === 'production'
      ? REPORTS_APP_URL_PUBLIC_HOST_DEFAULT
      : 'http://localhost:3014/reports'),
  REPORTS_MF_REMOTE_NAME,
  /**
   * Legacy fallback module + alternates: see `config/microfrontends/analytics.ts` to add screens.
   */
  ANALYTICS_MF_MODULE: ANALYTICS_MF_LEGACY_PRIMARY,
  ANALYTICS_MF_ALTERNATE_IDS,
  ANALYTICS_MF_DASHBOARD_MODULE: ANALYTICS_MF_ROUTE_MODULES.dashboard,
  ANALYTICS_MF_CREATE_PAGE_MODULE: ANALYTICS_MF_ROUTE_MODULES.create,
};
