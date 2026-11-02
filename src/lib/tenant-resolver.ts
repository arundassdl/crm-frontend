/**
 * Server-to-server Tenant Resolver client for Next.js BFF (doc 28 §4.1, §4.3).
 *
 * Calls Central's internal tenant resolver endpoint.
 * Validates user membership, subscription status, and active application entitlement.
 * Retrieves tenant backend URL and ephemeral RS256 Delegation JWT.
 * Caches resolution in-memory for 60 seconds.
 */

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
  readonly status: number;
  readonly code: string;
  readonly remediationUrl?: string;

  constructor(status: number, code: string, message: string, remediationUrl?: string) {
    super(message);
    this.name = 'TenantResolverError';
    this.status = status;
    this.code = code;
    this.remediationUrl = remediationUrl;
  }
}

interface CacheEntry {
  resolution: TenantResolution;
  expiresAt: number;
}

const resolverCache = new Map<string, CacheEntry>();

function getCacheKey(userId: string, organization: string, application: string): string {
  return `${userId}:${organization}:${application}`;
}

export function invalidateTenantCache(userId?: string, organization?: string, application: string = 'crm'): void {
  if (userId && organization) {
    resolverCache.delete(getCacheKey(userId, organization, application));
  } else {
    resolverCache.clear();
  }
}

export async function resolveTenant(
  userId: string,
  organization: string,
  application: string = 'crm',
): Promise<TenantResolution> {
  const cacheKey = getCacheKey(userId, organization, application);
  const now = Date.now();

  const cached = resolverCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.resolution;
  }

  const centralBaseUrl = (
    process.env.CENTRAL_BASE_URL ||
    process.env.NEXT_PUBLIC_CENTRAL_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');

  const secret = process.env.INTERNAL_SERVICE_SECRET || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (secret) {
    headers['X-Evoq-Internal-Secret'] = secret;
  }

  const url = `${centralBaseUrl}/api/method/evoq_saas_package_layer.api.internal_tenant_resolver.resolve`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        organization,
        application,
      }),
      cache: 'no-store',
    });
  } catch (err: any) {
    throw new TenantResolverError(
      503,
      'CENTRAL_UNAVAILABLE',
      'Unable to contact Central Tenant Resolver. Please try again shortly.',
    );
  }

  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    const errInfo = data.error || {};
    const status = errInfo.http_status || response.status || 500;
    const code = errInfo.code || 'RESOLVER_ERROR';
    const message = errInfo.message || 'Tenant resolution failed.';
    const remediationUrl = errInfo.remediation_url;

    throw new TenantResolverError(status, code, message, remediationUrl);
  }

  const resolvedData = data.message?.data || data.data;
  if (!resolvedData || !resolvedData.backend_url || !resolvedData.delegation_token) {
    throw new TenantResolverError(
      502,
      'INVALID_RESOLVER_RESPONSE',
      'Tenant resolver returned an invalid response structure.',
    );
  }

  const ttlSeconds = resolvedData.cache_ttl_seconds || 60;
  const resolution: TenantResolution = {
    userId: resolvedData.user_id,
    evoqUserKey: resolvedData.evoq_user_key,
    organization: resolvedData.organization,
    organizationName: resolvedData.organization_name || organization,
    application: resolvedData.application,
    backendUrl: resolvedData.backend_url.replace(/\/$/, ''),
    delegationToken: resolvedData.delegation_token,
    delegationTokenExpiresIn: resolvedData.delegation_token_expires_in || 300,
    cacheTtlSeconds: ttlSeconds,
    resolvedAt: now,
  };

  resolverCache.set(cacheKey, {
    resolution,
    expiresAt: now + ttlSeconds * 1000,
  });

  return resolution;
}
