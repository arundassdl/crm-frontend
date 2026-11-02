export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, parseSession } from '@/lib/session';
import { TenantResolverError, resolveTenant } from '@/lib/tenant-resolver';

const FORBIDDEN_CLIENT_HEADERS = new Set([
  'host',
  'x-evoq-delegation-token',
  'x-evoq-api-key',
  'x-evoq-internal-secret',
  'x-evoq-user-key',
  'authorization',
  'cookie',
]);

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Session check
  const rawCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSession(rawCookie);

  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Valid application session is required.' },
      { status: 401 },
    );
  }

  // 2. Multi-organization isolation & IDOR defense
  const requestedOrg = req.headers.get('x-organization-id') || req.nextUrl.searchParams.get('org');
  if (requestedOrg && requestedOrg.trim() !== session.organization) {
    return NextResponse.json(
      { error: 'ORGANIZATION_FORBIDDEN', message: 'Access to specified organization is forbidden.' },
      { status: 403 },
    );
  }

  // 3. Resolve tenant backend via Central Tenant Resolver
  let resolution;
  try {
    resolution = await resolveTenant(session.userId, session.organization, 'crm');
  } catch (err: any) {
    if (err instanceof TenantResolverError) {
      const resp: Record<string, any> = {
        error: err.code,
        message: err.message,
      };
      if (err.remediationUrl) {
        resp.remediation_url = err.remediationUrl;
      }
      return NextResponse.json(resp, { status: err.status });
    }

    return NextResponse.json(
      { error: 'RESOLVER_FAILURE', message: 'Failed to resolve tenant backend.' },
      { status: 500 },
    );
  }

  // 4. Construct target URL
  const pathSegments = params.path || [];
  const targetPath = '/' + pathSegments.join('/');
  const queryString = req.nextUrl.search;
  const targetUrl = `${resolution.backendUrl}${targetPath}${queryString}`;

  // 5. Build forwarded headers with injected Delegation Token & User Key
  const forwardHeaders = new Headers();
  req.headers.forEach((val, key) => {
    const lowerKey = key.toLowerCase();
    if (!FORBIDDEN_CLIENT_HEADERS.has(lowerKey)) {
      forwardHeaders.set(key, val);
    }
  });

  const backendHost = new URL(resolution.backendUrl).host;
  forwardHeaders.set('Host', backendHost);
  forwardHeaders.set('X-Evoq-Delegation-Token', resolution.delegationToken);
  forwardHeaders.set('X-Evoq-User-Key', session.evoqUserKey);

  // 6. Forward request to tenant backend site
  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      // Never forward backend cookies or delegation token references
      if (lowerKey !== 'set-cookie' && lowerKey !== 'x-evoq-delegation-token') {
        resHeaders.set(key, val);
      }
    });

    const resBody = await backendRes.arrayBuffer();
    return new NextResponse(resBody, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'TENANT_BACKEND_UNREACHABLE', message: 'Unable to reach tenant backend site.' },
      { status: 502 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
