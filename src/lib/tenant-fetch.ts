/**
 * Server-only helper for BFF route handlers that talk to the tenant Frappe backend (R55).
 *
 * Every call:
 *   1. reads the signed CRM session cookie from the incoming request,
 *   2. asks Central for the tenant backend + a short-lived delegation token,
 *   3. calls the tenant with X-Evoq-Delegation-Token / X-Evoq-User-Key,
 *   4. maps failures to a small set of error kinds the UI can show.
 *
 * The delegation token never leaves this process: it is not logged and is not
 * returned to the browser.
 */
import { NextResponse } from 'next/server';
import { CrmSession, SESSION_COOKIE_NAME, parseSession } from './session';
import { TenantResolverError, resolveTenant } from './tenant-resolver';

/** What the UI needs to know to pick the right message. */
export type BffErrorKind = 'auth' | 'permission' | 'not_found' | 'validation' | 'unavailable' | 'failed';

export class BffError extends Error {
  readonly status: number;
  readonly code: string;
  readonly kind: BffErrorKind;
  readonly remediationUrl?: string;

  constructor(status: number, code: string, kind: BffErrorKind, message: string, remediationUrl?: string) {
    super(message);
    this.name = 'BffError';
    this.status = status;
    this.code = code;
    this.kind = kind;
    this.remediationUrl = remediationUrl;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const anyReq = req as any;
  if (anyReq.cookies && typeof anyReq.cookies.get === 'function') {
    const v = anyReq.cookies.get(name);
    if (v) return typeof v === 'string' ? v : v.value;
  }
  const header = req.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

export function sessionFromRequest(req: Request): CrmSession | null {
  return parseSession(readCookie(req, SESSION_COOKIE_NAME));
}

function resolverKind(status: number): BffErrorKind {
  if (status === 401) return 'auth';
  if (status === 402 || status === 403) return 'permission';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'unavailable';
  return 'failed';
}

export interface TenantFetchInit {
  method?: string;
  /** Query parameters appended to the path. */
  query?: Record<string, string | number | undefined | null>;
  /** JSON-serialisable body (sent as application/json) or a raw body such as FormData. */
  json?: unknown;
  body?: BodyInit | null;
  headers?: Record<string, string>;
}

/**
 * Fetch `path` (e.g. `/api/method/frappe.client.get_list`) on the caller's tenant backend.
 * Throws BffError for session / resolver / network failures. Backend HTTP errors are
 * returned as the Response so callers can decide; use `frappeCall` for normalised errors.
 */
export async function tenantFetch(req: Request, path: string, init: TenantFetchInit = {}): Promise<Response> {
  const session = sessionFromRequest(req);
  if (!session) {
    throw new BffError(401, 'UNAUTHORIZED', 'auth', 'Your session has expired. Open CRM again from CTRL.');
  }

  let resolution;
  try {
    resolution = await resolveTenant(session.userId, session.organization, session.application || 'crm', session.createdAt);
  } catch (err) {
    if (err instanceof TenantResolverError) {
      throw new BffError(err.status, err.code, resolverKind(err.status), err.message, err.remediationUrl);
    }
    throw new BffError(502, 'RESOLVER_FAILURE', 'unavailable', 'CRM could not reach your organization right now.');
  }

  const url = new URL(path.startsWith('/') ? path : `/${path}`, resolution.backendUrl);
  // Never allow a path to escape to another host.
  if (url.origin !== new URL(resolution.backendUrl).origin) {
    throw new BffError(400, 'BAD_PATH', 'failed', 'Invalid backend path.');
  }
  for (const [k, v] of Object.entries(init.query || {})) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('X-Evoq-Delegation-Token', resolution.delegationToken);
  headers.set('X-Evoq-User-Key', session.evoqUserKey);

  let body: BodyInit | null | undefined = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }

  try {
    return await fetch(url.toString(), {
      method: init.method || (body ? 'POST' : 'GET'),
      headers,
      body: body ?? undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    throw new BffError(502, 'TENANT_BACKEND_UNREACHABLE', 'unavailable', 'CRM could not reach your organization right now.');
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** Pull the human message out of a Frappe error payload. */
export function frappeErrorMessage(payload: any): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  if (typeof payload._server_messages === 'string') {
    try {
      const list = JSON.parse(payload._server_messages);
      for (const item of Array.isArray(list) ? list : []) {
        const parsed = typeof item === 'string' ? JSON.parse(item) : item;
        if (parsed?.message) return stripHtml(String(parsed.message));
      }
    } catch {
      /* fall through */
    }
  }
  if (typeof payload.exception === 'string') {
    const msg = payload.exception.replace(/^[\w.]+(Error|Exception)?:\s*/, '');
    if (msg) return stripHtml(msg);
  }
  if (typeof payload.message === 'string') return stripHtml(payload.message);
  return undefined;
}

/** Map a non-2xx tenant response to a BffError. */
export function backendError(status: number, payload: any): BffError {
  const detail = frappeErrorMessage(payload);
  const excType: string = payload?.exc_type || '';
  if (status === 401) {
    return new BffError(401, 'BACKEND_AUTH_REJECTED', 'auth', 'Your session could not be verified. Open CRM again from CTRL.');
  }
  if (status === 403 || excType === 'PermissionError') {
    return new BffError(403, 'PERMISSION_DENIED', 'permission', detail || 'You do not have permission to do this.');
  }
  if (status === 404 || excType === 'DoesNotExistError') {
    return new BffError(404, 'NOT_FOUND', 'not_found', detail || 'Record not found.');
  }
  if (status === 409 || excType === 'DuplicateEntryError') {
    return new BffError(409, 'DUPLICATE', 'validation', detail || 'A record with this name already exists.');
  }
  if (status === 417 || status === 400 || status === 422) {
    return new BffError(422, 'VALIDATION_ERROR', 'validation', detail || 'The request was not accepted.');
  }
  if (status >= 500) {
    return new BffError(502, 'BACKEND_ERROR', 'unavailable', 'CRM is temporarily unavailable. Try again shortly.');
  }
  return new BffError(status || 500, 'REQUEST_FAILED', 'failed', detail || 'The request failed.');
}

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

/**
 * Call a whitelisted Frappe method and return the parsed JSON body (`{message, ...}`).
 * Throws BffError on any failure.
 */
export async function frappeCall(
  req: Request,
  method: string,
  args: Record<string, unknown> = {},
  httpMethod: 'GET' | 'POST' = 'POST',
): Promise<any> {
  if (!/^[A-Za-z0-9_.]+$/.test(method)) {
    throw new BffError(400, 'BAD_METHOD', 'failed', 'Invalid method.');
  }
  const path = `/api/method/${method}`;
  let res: Response;
  if (httpMethod === 'GET') {
    const query: Record<string, string> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v === undefined || v === null) continue;
      query[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    res = await tenantFetch(req, path, { method: 'GET', query });
  } else {
    res = await tenantFetch(req, path, { method: 'POST', json: args });
  }
  const payload = await readJson(res);
  if (!res.ok) throw backendError(res.status, payload);
  return payload;
}

/** Same as tenantFetch but parses JSON and throws normalised errors. */
export async function tenantJson(req: Request, path: string, init: TenantFetchInit = {}): Promise<any> {
  const res = await tenantFetch(req, path, init);
  const payload = await readJson(res);
  if (!res.ok) throw backendError(res.status, payload);
  return payload;
}

/** JSON error response the client helpers understand. Never includes tokens. */
export function bffErrorResponse(err: unknown, logTag?: string): NextResponse {
  const e =
    err instanceof BffError
      ? err
      : new BffError(500, 'INTERNAL_ERROR', 'failed', 'Something went wrong. Try again.');
  if (!(err instanceof BffError) && logTag) {
    // Message only: never log request headers or tokens.
    console.error(`[${logTag}]`, (err as any)?.message || err);
  }
  const body: Record<string, unknown> = { error: e.code, kind: e.kind, message: e.message };
  if (e.remediationUrl) body.remediation_url = e.remediationUrl;
  const res = NextResponse.json(body, { status: e.status });
  if (e.code === 'SESSION_REVOKED') {
    // R59: signed out everywhere — drop this browser's CRM session so the next page goes to sign-in.
    res.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0, expires: new Date(0), httpOnly: true });
    res.cookies.set('isLoggedIn', '', { path: '/', maxAge: 0, expires: new Date(0) });
  }
  return res;
}
