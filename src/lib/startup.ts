import { createPublicKey } from "node:crypto";
import { sessionSecret } from "./session";
import { centralRequestHeaders, getCentralBaseUrl } from "./central";
import { publicOrigin } from "./security";
import { trustedBackend } from "./backend-policy";
export function validateConfiguration(): void {
  sessionSecret();
  publicOrigin();
  getCentralBaseUrl();
  centralRequestHeaders();
  const key = createPublicKey(process.env.CENTRAL_DELEGATION_PUBLIC_KEY || "");
  if (
    key.asymmetricKeyType !== "rsa" ||
    (key.asymmetricKeyDetails?.modulusLength || 0) < 2048
  ) {
    throw new Error(
      "A Central RSA delegation public key of at least 2048 bits is required",
    );
  }
  const issuer = new URL(
    process.env.CENTRAL_JWT_ISSUER || "https://cloud.evoq.app",
  );
  if (
    issuer.protocol !== "https:" ||
    issuer.username ||
    issuer.password ||
    issuer.search ||
    issuer.hash
  )
    throw new Error("Invalid Central JWT issuer");
  const hosts = (process.env.TENANT_BACKEND_HOSTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!hosts.length) throw new Error("TENANT_BACKEND_HOSTS is required");
  for (const host of hosts) {
    const match = host.match(/^crm\.(team-[0-9]{5,})\.evoq\.app$/);
    if (!match) throw new Error("Invalid tenant backend allowlist");
    trustedBackend(`https://${host}`, match[1].toUpperCase());
  }
}
