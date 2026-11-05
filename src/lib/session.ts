import crypto from "node:crypto";
export const SESSION_COOKIE_NAME = "evoq_crm_session";
export const SESSION_TTL_SECONDS = 86400;
export interface CrmSession {
  userId: string;
  evoqUserKey: string;
  organization: string;
  application: string;
  createdAt: number;
  expiresAt: number;
}
export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET || "";
  if (
    Buffer.byteLength(secret) < 32 ||
    /dev-session|example|change.?me|placeholder/i.test(secret)
  )
    throw new Error(
      "A provisioned SESSION_SECRET of at least 32 bytes is required",
    );
  return secret;
}
function sign(body: string): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
}
function valid(s: CrmSession): boolean {
  const now = Date.now();
  return (
    !!s &&
    typeof s.userId === "string" &&
    s.userId.length <= 254 &&
    !["", "Guest", "Administrator"].includes(s.userId) &&
    typeof s.evoqUserKey === "string" &&
    /^[A-Za-z0-9_-]{1,140}$/.test(s.evoqUserKey) &&
    /^TEAM-[0-9]{5,}$/.test(s.organization) &&
    s.application === "crm" &&
    Number.isFinite(s.createdAt) &&
    Number.isFinite(s.expiresAt) &&
    s.createdAt > 0 &&
    s.createdAt <= now + 30_000 &&
    s.expiresAt > now &&
    s.expiresAt > s.createdAt &&
    s.expiresAt - s.createdAt <= SESSION_TTL_SECONDS * 1000
  );
}
export function serializeSession(s: CrmSession): string {
  if (!valid(s)) throw new Error("Invalid CRM session");
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}
export function parseSession(raw: string | undefined): CrmSession | null {
  sessionSecret();
  if (!raw || raw.length > 4096) return null;
  const [body, sig, extra] = raw.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const a = Buffer.from(sig),
    b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return valid(value) ? value : null;
  } catch {
    return null;
  }
}
export function getSessionCookieOptions(
  production = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
export function signForPurpose(
  purpose: string,
  data: Record<string, unknown>,
  ttl: number,
): string {
  const body = Buffer.from(
    JSON.stringify({ ...data, purpose, exp: Date.now() + ttl * 1000 }),
  ).toString("base64url");
  return `${body}.${sign(`${purpose}:${body}`)}`;
}
export function verifyForPurpose<T extends Record<string, unknown>>(
  purpose: string,
  raw: string | undefined,
): T | null {
  if (!raw || raw.length > 4096) return null;
  const [body, sig, extra] = raw.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const a = Buffer.from(sig),
    b = Buffer.from(sign(`${purpose}:${body}`));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return d.purpose === purpose &&
      typeof d.exp === "number" &&
      d.exp > Date.now()
      ? d
      : null;
  } catch {
    return null;
  }
}
