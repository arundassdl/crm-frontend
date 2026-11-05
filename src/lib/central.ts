/**
 * Server-to-server Central (cloud.evoq.app) client helpers for the CRM BFF.
 *
 * When CENTRAL_BASE_URL is an IP/loopback (http://127.0.0.1:8000), Frappe resolves the site
 * from the Host header. Without Host: <site>, requests fail with "127.0.0.1 does not exist"
 * and launch redemption incorrectly surfaces as TICKET_INVALID_OR_EXPIRED.
 */

export function getCentralBaseUrl(): string {
  const raw = process.env.CENTRAL_BASE_URL;
  if (!raw) throw new Error("CENTRAL_BASE_URL is required");
  const url = new URL(raw);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !(
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(url.hostname))
    )
  ) {
    throw new Error("Invalid Central transport configuration");
  }
  return url.origin;
}

/** Site hostname Frappe expects (multi-tenant sites directory). */
export function getCentralSiteHost(): string {
  const explicit = (
    process.env.CENTRAL_SITE_HOST ||
    process.env.BFF_SITE_HOST ||
    ""
  ).trim();
  if (explicit) return explicit;

  try {
    const base = getCentralBaseUrl();
    const host = new URL(base).hostname;
    if (
      host &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "::1"
    ) {
      return host;
    }
  } catch {
    /* fall through */
  }
  return "cloud.evoq.app";
}

export function centralRequestHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Host: getCentralSiteHost(),
    ...extra,
  };
  const secret = process.env.INTERNAL_SERVICE_SECRET || "";
  if (secret.length < 32)
    throw new Error("INTERNAL_SERVICE_SECRET is required");
  if (secret && !headers["X-Evoq-Internal-Secret"]) {
    headers["X-Evoq-Internal-Secret"] = secret;
  }
  return headers;
}
