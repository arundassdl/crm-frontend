// R58 (doc 62): Evoq One is the customer entry point for CRM sign-in. Edge-safe: no Node-only imports.
import { getCtrlUrl } from "./ctrl";

export const DEFAULT_ONE_URL = "https://one.evoq.app";

/** CRM pages a visitor may be returned to after sign-in (relative paths only). */
const CRM_MODULE_PATH =
  /^\/(leads|deals|contacts|accounts|tasks|user|settings|setup|reports|report|analytics|dashboard-builder|integration-unavailable)(\/[A-Za-z0-9_-]{1,64})*\/?$/;
const CRM_ORG_PATH =
  /^\/org\/([A-Za-z0-9_-]{1,64})(\/[A-Za-z0-9_-]{1,64})*\/?$/;

export function safeCrmPath(value: string | null | undefined): string | null {
  if (!value || value.length > 300) return null;
  return CRM_MODULE_PATH.test(value) || CRM_ORG_PATH.test(value) ? value : null;
}

function oneOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_EVOQ_ONE_URL || DEFAULT_ONE_URL;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.origin : DEFAULT_ONE_URL;
  } catch {
    return DEFAULT_ONE_URL;
  }
}

/** Where a visitor without a valid CRM session goes: the Evoq One CRM page, with sign-in offered. */
export function getOneSigninUrl(next?: string | null): string {
  const url = new URL("/products/crm", oneOrigin());
  url.searchParams.set("signin", "required");
  const safe = safeCrmPath(next);
  if (safe) url.searchParams.set("next", safe);
  return url.toString();
}

/** CTRL's organization chooser / launch decision for CRM (Central re-checks membership). */
export function getCtrlCrmLaunchUrl(org?: string | null): string {
  const url = new URL("launch/crm", getCtrlUrl());
  if (org && /^[A-Za-z0-9_-]{1,64}$/.test(org))
    url.searchParams.set("org", org);
  else {
    url.pathname = "/launch/crm/choose";
    url.searchParams.set("reason", "select");
  }
  return url.toString();
}
