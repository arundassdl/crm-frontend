// Central control plane (CTRL) SSO entry. Edge-safe: no Node-only imports.
export const DEFAULT_CTRL_URL = 'https://ctrl.evoq.app';

export function getCtrlUrl(): string {
  return (process.env.NEXT_PUBLIC_CTRL_URL || DEFAULT_CTRL_URL).replace(/\/+$/, '') + '/';
}
