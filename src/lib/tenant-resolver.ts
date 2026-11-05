import { centralRequestHeaders, getCentralBaseUrl } from "./central";
import { trustedBackend } from "./backend-policy";
import { verifyDelegation } from "./delegation";
export interface TenantResolution {
  userId: string;
  evoqUserKey: string;
  organization: string;
  organizationName: string;
  application: string;
  backendUrl: string;
  delegationToken: string;
  delegationTokenExpiresIn: number;
  cacheTtlSeconds: number;
  resolvedAt: number;
}
export class TenantResolverError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly remediationUrl?: string,
  ) {
    super(message);
  }
}
// No authorization cache: every request must observe Central revocation and entitlement state.
export function invalidateTenantCache(
  _userId?: string,
  ..._ignored: string[]
): void {}
export async function resolveTenant(
  userId: string,
  organization: string,
  application = "crm",
  sessionCreatedAt?: number,
): Promise<TenantResolution> {
  if (application !== "crm" || !/^TEAM-[0-9]{5,}$/.test(organization))
    throw new TenantResolverError(
      403,
      "INVALID_CONTEXT",
      "Invalid CRM context.",
    );
  let response: Response;
  try {
    response = await fetch(
      `${getCentralBaseUrl()}/api/method/evoq_saas_package_layer.api.internal_tenant_resolver.resolve`,
      {
        method: "POST",
        headers: centralRequestHeaders(),
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          user_id: userId,
          organization,
          application,
          session_issued_at:
            typeof sessionCreatedAt === "number"
              ? sessionCreatedAt / 1000
              : undefined,
        }),
      },
    );
  } catch {
    throw new TenantResolverError(
      503,
      "CENTRAL_UNAVAILABLE",
      "Authorization is temporarily unavailable.",
    );
  }
  const raw = await response.json().catch(() => null),
    payload = raw?.message ?? raw;
  if (!response.ok || payload?.status !== "success") {
    const code = payload?.error?.code || payload?.code;
    const known = new Set([
      "SESSION_REVOKED",
      "ORGANIZATION_FORBIDDEN",
      "SUBSCRIPTION_SUSPENDED",
      "APPLICATION_NOT_ENTITLED",
      "ENTITLEMENT_REVOKED",
      "ENTITLEMENT_INACTIVE",
      "TENANT_SITE_NOT_READY",
      "USER_DISABLED",
    ]);
    throw new TenantResolverError(
      [401, 402, 403, 404, 503].includes(response.status)
        ? response.status
        : 502,
      known.has(code) ? code : "AUTHORIZATION_REFUSED",
      "Organization access could not be authorized.",
    );
  }
  const d = payload.data;
  if (
    !d ||
    d.user_id !== userId ||
    d.organization !== organization ||
    d.application !== "crm" ||
    typeof d.evoq_user_key !== "string" ||
    !d.evoq_user_key
  ) {
    throw new TenantResolverError(
      502,
      "INVALID_RESOLVER_RESPONSE",
      "Organization access could not be authorized.",
    );
  }
  const backend = trustedBackend(d.backend_url, organization).origin;
  verifyDelegation(d.delegation_token, {
    userKey: d.evoq_user_key,
    organization,
    backend,
  });
  return {
    userId,
    evoqUserKey: d.evoq_user_key,
    organization,
    organizationName: d.organization_name || organization,
    application: "crm",
    backendUrl: backend,
    delegationToken: d.delegation_token,
    delegationTokenExpiresIn: Math.min(
      Number(d.delegation_token_expires_in) || 300,
      300,
    ),
    cacheTtlSeconds: 0,
    resolvedAt: Date.now(),
  };
}
