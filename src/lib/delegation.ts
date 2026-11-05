import { createPublicKey, verify } from "node:crypto";
import { SecurityError } from "./security";
export function verifyDelegation(
  token: string,
  expected: { userKey: string; organization: string; backend: string },
): void {
  try {
    if (typeof token !== "string" || token.length > 16384) throw new Error();
    const [header, payload, signature, extra] = token.split(".");
    if (!header || !payload || !signature || extra !== undefined)
      throw new Error();
    const h = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    const c = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const pem = process.env.CENTRAL_DELEGATION_PUBLIC_KEY;
    if (!pem || h.alg !== "RS256" || h.jku || h.jwk || h.x5u || h.crit)
      throw new Error();
    if (
      !verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${payload}`),
        createPublicKey(pem),
        Buffer.from(signature, "base64url"),
      )
    )
      throw new Error();
    const now = Date.now() / 1000;
    if (
      c.iss !== (process.env.CENTRAL_JWT_ISSUER || "https://cloud.evoq.app") ||
      c.aud !== expected.backend ||
      c.sub !== expected.userKey ||
      c.org !== expected.organization ||
      c.app !== "crm" ||
      c.scope !== "tenant_delegation" ||
      typeof c.jti !== "string" ||
      !c.jti ||
      !Number.isFinite(c.exp) ||
      !Number.isFinite(c.iat) ||
      c.exp <= now ||
      c.iat > now + 30 ||
      c.exp - c.iat > 300 ||
      c.exp <= c.iat ||
      (c.nbf !== undefined && (!Number.isFinite(c.nbf) || c.nbf > now))
    )
      throw new Error();
  } catch {
    throw new SecurityError(502, "DELEGATION_REJECTED");
  }
}
