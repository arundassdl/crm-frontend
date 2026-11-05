/**
 * R63 (doc 67): CRM user management through the tenant's secured sdl_user_management 2.0 API.
 *
 * Every call goes through `frappeCall`, i.e. the delegated Evoq Tenant Auth session of the signed-in
 * user, so the tenant applies its own rules (managers only, no self-changes, approved profiles only).
 * This module adds input validation at the BFF and a clear answer for tenants that do not have the
 * app yet. Shared by route handlers only (server side).
 */
import { BffError, frappeCall } from "@/lib/tenant-fetch";

export const ROLE_PROFILES = ["EVOQ CRM User", "EVOQ CRM Manager"] as const;
export type RoleProfile = (typeof ROLE_PROFILES)[number];

export interface ManagedUser {
  user: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  user_image: string | null;
  enabled: boolean;
  suspended: boolean;
  last_active: string | null;
  role_profile: string | null;
  roles: string[];
  is_manager: boolean;
}

export interface MyAccount extends ManagedUser {
  organization: string | null;
  identity_managed_by: "EVOQ";
}

const METHOD = "sdl_user_management.um.";
const EMAIL = /^[^\s@]{1,128}@[^\s@]{1,125}$/;

export function validUser(value: unknown): string {
  if (typeof value !== "string" || !EMAIL.test(value.trim())) {
    throw new BffError(
      400,
      "INVALID_USER",
      "validation",
      "Choose a user from your organization.",
    );
  }
  return value.trim();
}

export function validProfile(value: unknown): RoleProfile {
  if (
    typeof value !== "string" ||
    !(ROLE_PROFILES as readonly string[]).includes(value)
  ) {
    throw new BffError(
      400,
      "INVALID_ROLE_PROFILE",
      "validation",
      "Choose an available role.",
    );
  }
  return value as RoleProfile;
}

export function validName(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.length > 140) {
    throw new BffError(
      400,
      "INVALID_NAME",
      "validation",
      `Enter a valid ${field}.`,
    );
  }
  return value;
}

/** Call the tenant's user-management API; a tenant without the app answers "not available yet". */
export async function umCall(
  req: Request,
  method: string,
  args: Record<string, unknown> = {},
  http: "GET" | "POST" = "GET",
) {
  try {
    const res = await frappeCall(req, `${METHOD}${method}`, args, http);
    return res?.message;
  } catch (err) {
    if (
      err instanceof BffError &&
      /is not installed|Failed to get method/i.test(err.message)
    ) {
      throw new BffError(
        503,
        "USER_MANAGEMENT_UNAVAILABLE",
        "unavailable",
        "User management is not available for your workspace yet.",
      );
    }
    throw err;
  }
}
