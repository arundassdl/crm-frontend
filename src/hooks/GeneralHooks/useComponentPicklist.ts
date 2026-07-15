"use client";

import { useEffect, useState } from "react";
import { readAccessTokenString, readRoleProfileFromStorage } from "@/utils/accessTokenDataStorage";
import {
  ComponentPicklistOption,
  fetchModulePicklistOptions,
} from "@/services/api/general_apis/component-picklist-api";

interface UseComponentPicklistOptions {
  /** Target a specific layout; otherwise the module's layout is resolved automatically. */
  layoutId?: string;
  /**
   * Auth token. Pass the component's reactive token (e.g. `userToken?.access_token`)
   * so the hook re-fetches once auth is ready — this avoids the intermittent empty
   * result when storage isn't populated yet at first render. Falls back to storage.
   */
  token?: string;
  /** Role profile for layout resolution; falls back to storage. */
  roleProfile?: string;
}

/**
 * Generic hook to load Component Pick List options for any module/field.
 *
 * Reusable across the application — pass the module name and the pick list field
 * key (e.g. `useComponentPicklist("Leads", "lead_status")`). The pick list is
 * layout-scoped; the correct layout is resolved (and cached) automatically.
 *
 * Returns backend-driven options carrying `label`, `value`, `color` and `is_default`.
 */
export function useComponentPicklist(
  module: string,
  fieldName: string | string[],
  opts: UseComponentPicklistOptions = {}
) {
  const { layoutId, token: tokenProp, roleProfile: roleProfileProp } = opts;
  // Stable key so an inline array literal doesn't re-trigger the effect every render.
  const fieldKey = Array.isArray(fieldName) ? fieldName.join(",") : fieldName;
  const [options, setOptions] = useState<ComponentPicklistOption[]>([]);
  const [resolvedField, setResolvedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = tokenProp || readAccessTokenString();
      if (!token || !module || !fieldKey) {
        // Auth not ready yet: stay in loading so a later token change re-triggers us.
        if (!cancelled) setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const roleProfile = roleProfileProp ?? readRoleProfileFromStorage();
        const result = await fetchModulePicklistOptions(module, fieldName, token, roleProfile, layoutId);
        if (!cancelled) {
          setOptions(result.options || []);
          setResolvedField(result.field);
        }
      } catch (err) {
        console.error("useComponentPicklist: failed to load picklist", err);
        if (!cancelled) {
          setError(err);
          setOptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, fieldKey, layoutId, tokenProp, roleProfileProp]);

  return { options, field: resolvedField, loading, error };
}

export default useComponentPicklist;
