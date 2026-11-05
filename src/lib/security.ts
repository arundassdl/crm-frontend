import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  CrmSession,
  parseSession,
  SESSION_COOKIE_NAME,
  sessionSecret,
} from "./session";
export class SecurityError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export const ORG_HEADER = "x-evoq-page-org";
export function publicOrigin(): string {
  const u = new URL(process.env.CRM_PUBLIC_ORIGIN || "https://crm.evoq.app");
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.pathname !== "/" ||
    u.search ||
    u.hash
  )
    throw new Error("Invalid CRM_PUBLIC_ORIGIN");
  return u.origin;
}
export function csrfToken(raw: string): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(`crm-csrf:${raw}`)
    .digest("base64url");
}
export function equalSecret(a: string, b: string): boolean {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export function assertOrigin(req: Request): void {
  if (req.headers.get("origin") !== publicOrigin())
    throw new SecurityError(403, "CSRF_ORIGIN_REJECTED");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin")
    throw new SecurityError(403, "CSRF_SITE_REJECTED");
}
export async function assertCsrf(req: Request, raw: string): Promise<void> {
  assertOrigin(req);
  let supplied = req.headers.get("x-evoq-csrf") || "";
  if (
    !supplied &&
    req.headers
      .get("content-type")
      ?.startsWith("application/x-www-form-urlencoded")
  )
    supplied = new URLSearchParams(await req.clone().text()).get("_csrf") || "";
  if (!equalSecret(supplied, csrfToken(raw)))
    throw new SecurityError(403, "CSRF_TOKEN_REJECTED");
}
export function sessionCookie(req: Request): string {
  const value = (req.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE_NAME}=`));
  try {
    return value
      ? decodeURIComponent(value.slice(SESSION_COOKIE_NAME.length + 1))
      : "";
  } catch {
    return "";
  }
}
// Bounded per-process defense. A distributed limiter remains a production release gate.
const buckets = new Map<string, { until: number; count: number }>();
export function limitRequests(key: string, now = Date.now()): void {
  if (buckets.size > 5000) {
    for (const [k, v] of Array.from(buckets.entries()))
      if (v.until <= now) buckets.delete(k);
    if (buckets.size > 5000) throw new SecurityError(429, "RATE_LIMITED");
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.until <= now) {
    buckets.set(key, { until: now + 60_000, count: 1 });
    return;
  }
  if (++bucket.count > 300) throw new SecurityError(429, "RATE_LIMITED");
}
export async function requireContext(
  req: Request,
  requireOrg = true,
): Promise<CrmSession> {
  if (
    [
      "authorization",
      "x-evoq-delegation-token",
      "x-evoq-internal-secret",
      "x-evoq-user-key",
      "x-evoq-api-key",
    ].some((h) => !!req.headers.get(h))
  )
    throw new SecurityError(400, "CLIENT_CREDENTIALS_FORBIDDEN");
  const raw = sessionCookie(req),
    session = parseSession(raw);
  if (!session) throw new SecurityError(401, "UNAUTHORIZED");
  if (requireOrg && req.headers.get(ORG_HEADER) !== session.organization)
    throw new SecurityError(409, "ORGANIZATION_CHANGED");
  for (const org of [
    new URL(req.url).searchParams.get("org"),
    req.headers.get("x-organization-id"),
  ])
    if (org && org !== session.organization)
      throw new SecurityError(403, "ORGANIZATION_FORBIDDEN");
  const length = Number(req.headers.get("content-length") || 0);
  if (!Number.isFinite(length) || length < 0 || length > 20 * 1024 * 1024)
    throw new SecurityError(413, "REQUEST_TOO_LARGE");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method))
    await assertCsrf(req, raw);
  limitRequests(`${session.userId}:${session.organization}`);
  return session;
}
export function securityResponse(error: unknown): NextResponse {
  const known = error instanceof SecurityError;
  return NextResponse.json(
    {
      error: known ? error.code : "INTERNAL_ERROR",
      message: "The request could not be authorized.",
    },
    {
      status: known ? error.status : 500,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
async function boundedBody(req: Request): Promise<void> {
  if (!req.body) return;
  const limit = req.headers.get("content-type")?.includes("multipart/form-data")
    ? 20 * 1024 * 1024
    : 2 * 1024 * 1024;
  const reader = req.clone().body!.getReader();
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) {
        void reader.cancel();
        throw new SecurityError(413, "REQUEST_TOO_LARGE");
      }
    }
  } finally {
    reader.releaseLock();
  }
}
export function protectedHandler<
  T extends (req: NextRequest, context: any) => Promise<Response>,
>(handler: T): T {
  return (async (req: NextRequest, context: any) => {
    try {
      await requireContext(req);
      await boundedBody(req);
      const response = await handler(req, context);
      response.headers.set("Cache-Control", "no-store, private");
      response.headers.set("X-Content-Type-Options", "nosniff");
      return response;
    } catch (error) {
      return securityResponse(error);
    }
  }) as T;
}
