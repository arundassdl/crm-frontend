import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import https from "node:https";
import { SecurityError } from "./security";
export function trustedBackend(raw: string, org: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new SecurityError(502, "UNTRUSTED_BACKEND");
  }
  const hosts = (process.env.TENANT_BACKEND_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.port ||
    u.search ||
    u.hash ||
    u.pathname !== "/" ||
    isIP(u.hostname) ||
    !hosts.includes(u.hostname) ||
    u.hostname !== `crm.${org.toLowerCase()}.evoq.app`
  )
    throw new SecurityError(502, "UNTRUSTED_BACKEND");
  return u;
}
export function publicAddress(address: string): boolean {
  // IPv6 deliberately refused until a tested IPv6 egress policy is available.
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0)
  );
}
export function backendPath(path: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    throw new SecurityError(400, "BAD_PATH");
  }
  if (!path.startsWith("/api/") && !path.startsWith("/private/files/"))
    throw new SecurityError(400, "BAD_PATH");
  if (
    /[\\\x00-\x1f#]/.test(decoded) ||
    decoded.includes("..") ||
    decoded.includes("//") ||
    /%[0-9a-f]{2}/i.test(decoded)
  )
    throw new SecurityError(400, "BAD_PATH");
  return path;
}
/** Resolve once, validate every DNS answer, pin TLS to the checked address. Never follow redirects. */
export async function tenantTransport(
  url: URL,
  init: RequestInit,
): Promise<Response> {
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new SecurityError(502, "UNTRUSTED_BACKEND_ADDRESS");
  const chosen = addresses[0],
    headers = new Headers(init.headers);
  let body: Buffer | undefined;
  if (init.body != null) {
    const encoded = new Request("https://body.invalid", {
      method: "POST",
      body: init.body,
    });
    if (!headers.has("content-type") && encoded.headers.has("content-type"))
      headers.set("content-type", encoded.headers.get("content-type")!);
    body = Buffer.from(await encoded.arrayBuffer());
    if (body.length > 20 * 1024 * 1024)
      throw new SecurityError(413, "REQUEST_TOO_LARGE");
  }
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: init.method || "GET",
        headers: Object.fromEntries(headers),
        timeout: 15_000,
        servername: url.hostname,
        lookup: ((_host: string, options: any, callback: any) => {
          if (options?.all) callback(null, [chosen]);
          else callback(null, chosen.address, chosen.family);
        }) as any,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 20 * 1024 * 1024) {
            request.destroy(new Error("Response limit exceeded"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () => {
          const safe = new Headers();
          for (const name of ["content-type", "content-disposition"]) {
            const v = response.headers[name];
            if (typeof v === "string") safe.set(name, v);
          }
          safe.set("Cache-Control", "no-store, private");
          const status = response.statusCode || 502;
          if (status >= 300 && status < 400) {
            reject(new SecurityError(502, "BACKEND_REDIRECT_REJECTED"));
            return;
          }
          resolve(
            new Response(
              [204, 205, 304].includes(status) ? null : Buffer.concat(chunks),
              { status, headers: safe },
            ),
          );
        });
      },
    );
    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error("Upstream timeout")));
    if (body) request.write(body);
    request.end();
  });
}
