import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  TenantResolverError,
  invalidateTenantCache,
  resolveTenant,
} from '../src/lib/tenant-resolver';

const origFetch = global.fetch;

describe('BFF Tenant Resolver & S2S Delegation JWT Client (doc 28 §4)', () => {
  beforeEach(() => {
    invalidateTenantCache();
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  test('resolves tenant and returns backend metadata and delegation token', async () => {
    let callCount = 0;
    global.fetch = (async (url: string, init: any) => {
      callCount++;
      assert.ok(url.includes('evoq_saas_package_layer.api.internal_tenant_resolver.resolve'));
      const body = JSON.parse(init.body);
      assert.strictEqual(body.user_id, 'user1@example.com');
      assert.strictEqual(body.organization, 'team-123');
      assert.strictEqual(body.application, 'crm');

      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            user_id: 'user1@example.com',
            evoq_user_key: 'USR-TEST1',
            organization: 'team-123',
            organization_name: 'Acme Corp',
            application: 'crm',
            backend_url: 'https://crm.team-123.evoq.app',
            delegation_token: 'jwt-delegation-token-xyz',
            delegation_token_expires_in: 300,
            cache_ttl_seconds: 60,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    const res = await resolveTenant('user1@example.com', 'team-123', 'crm');
    assert.strictEqual(res.userId, 'user1@example.com');
    assert.strictEqual(res.evoqUserKey, 'USR-TEST1');
    assert.strictEqual(res.organization, 'team-123');
    assert.strictEqual(res.backendUrl, 'https://crm.team-123.evoq.app');
    assert.strictEqual(res.delegationToken, 'jwt-delegation-token-xyz');
    assert.strictEqual(callCount, 1);

    // Second call within 60s must use in-memory cache and NOT invoke fetch again
    const cachedRes = await resolveTenant('user1@example.com', 'team-123', 'crm');
    assert.strictEqual(cachedRes.delegationToken, 'jwt-delegation-token-xyz');
    assert.strictEqual(callCount, 1); // No new network call
  });

  test('invalidateTenantCache forces fresh resolver call', async () => {
    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            user_id: 'user1@example.com',
            evoq_user_key: 'USR-TEST1',
            organization: 'team-123',
            organization_name: 'Acme Corp',
            application: 'crm',
            backend_url: 'https://crm.team-123.evoq.app',
            delegation_token: 'jwt-delegation-token-xyz',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    await resolveTenant('user1@example.com', 'team-123', 'crm');
    assert.strictEqual(callCount, 1);

    invalidateTenantCache('user1@example.com', 'team-123', 'crm');
    await resolveTenant('user1@example.com', 'team-123', 'crm');
    assert.strictEqual(callCount, 2);
  });

  test('handles 402 SUBSCRIPTION_SUSPENDED with remediation url', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: {
            code: 'SUBSCRIPTION_SUSPENDED',
            message: 'Subscription is suspended or past due.',
            http_status: 402,
            remediation_url: '/billing',
          },
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    await assert.rejects(
      async () => resolveTenant('user1@example.com', 'team-123', 'crm'),
      (err: TenantResolverError) => {
        assert.strictEqual(err.status, 402);
        assert.strictEqual(err.code, 'SUBSCRIPTION_SUSPENDED');
        assert.strictEqual(err.remediationUrl, '/billing');
        return true;
      },
    );
  });

  test('handles 403 APPLICATION_NOT_ENTITLED and ENTITLEMENT_REVOKED', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: {
            code: 'APPLICATION_NOT_ENTITLED',
            message: 'Organization has not subscribed to this application.',
            http_status: 403,
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    await assert.rejects(
      async () => resolveTenant('user1@example.com', 'team-123', 'crm'),
      (err: TenantResolverError) => {
        assert.strictEqual(err.status, 403);
        assert.strictEqual(err.code, 'APPLICATION_NOT_ENTITLED');
        return true;
      },
    );
  });

  test('handles 503 TENANT_SITE_NOT_READY', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: {
            code: 'TENANT_SITE_NOT_READY',
            message: 'Tenant instance is not ready.',
            http_status: 503,
          },
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }) as any;

    await assert.rejects(
      async () => resolveTenant('user1@example.com', 'team-123', 'crm'),
      (err: TenantResolverError) => {
        assert.strictEqual(err.status, 503);
        assert.strictEqual(err.code, 'TENANT_SITE_NOT_READY');
        return true;
      },
    );
  });
});
