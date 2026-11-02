import { test, describe } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET, HEAD, POST } from '../src/app/api/health/route';

describe('Application Health Endpoint (/api/health) (doc 28 §8, §9)', () => {
  test('GET returns HTTP 200 with status ok and cache-control headers', async () => {
    const req = new NextRequest('http://localhost:3001/api/health', {
      method: 'GET',
    });
    const res = await GET(req);

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('cache-control')?.includes('no-cache'));
    assert.ok(res.headers.get('content-type')?.includes('application/json'));

    const body = await res.json();
    assert.deepStrictEqual(body, { status: 'ok' });
  });

  test('HEAD returns HTTP 200 with empty body', async () => {
    const req = new NextRequest('http://localhost:3001/api/health', {
      method: 'HEAD',
    });
    const res = await HEAD(req);

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('cache-control')?.includes('no-cache'));
  });

  test('POST returns HTTP 405 Method Not Allowed', async () => {
    const req = new NextRequest('http://localhost:3001/api/health', {
      method: 'POST',
    });
    const res = await POST(req);

    assert.strictEqual(res.status, 405);
    const body = await res.json();
    assert.strictEqual(body.error, 'Method Not Allowed');
    assert.strictEqual(res.headers.get('allow'), 'GET, HEAD');
  });
});
