import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { centralRequestHeaders, getCentralBaseUrl, getCentralSiteHost } from '../src/lib/central';

describe('Central S2S Host binding', () => {
  const prev = {
    CENTRAL_BASE_URL: process.env.CENTRAL_BASE_URL,
    CENTRAL_SITE_HOST: process.env.CENTRAL_SITE_HOST,
    BFF_SITE_HOST: process.env.BFF_SITE_HOST,
    NEXT_PUBLIC_CENTRAL_URL: process.env.NEXT_PUBLIC_CENTRAL_URL,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test('loopback CENTRAL_BASE_URL still targets cloud.evoq.app via Host', () => {
    process.env.CENTRAL_BASE_URL = 'http://127.0.0.1:8000';
    delete process.env.CENTRAL_SITE_HOST;
    delete process.env.BFF_SITE_HOST;
    assert.strictEqual(getCentralBaseUrl(), 'http://127.0.0.1:8000');
    assert.strictEqual(getCentralSiteHost(), 'cloud.evoq.app');
    const headers = centralRequestHeaders();
    assert.strictEqual(headers.Host, 'cloud.evoq.app');
  });

  test('explicit CENTRAL_SITE_HOST wins', () => {
    process.env.CENTRAL_BASE_URL = 'http://127.0.0.1:8000';
    process.env.CENTRAL_SITE_HOST = 'cloud.evoq.app';
    assert.strictEqual(getCentralSiteHost(), 'cloud.evoq.app');
  });

  test('public CENTRAL_BASE_URL hostname is used as Host', () => {
    process.env.CENTRAL_BASE_URL = 'https://cloud.evoq.app';
    delete process.env.CENTRAL_SITE_HOST;
    delete process.env.BFF_SITE_HOST;
    assert.strictEqual(getCentralSiteHost(), 'cloud.evoq.app');
  });
});
