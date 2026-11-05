import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign, createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  serializeSession,
  parseSession,
  SESSION_COOKIE_NAME,
  sessionSecret,
} from "../src/lib/session";
import {
  csrfToken,
  requireContext,
  SecurityError,
  protectedHandler,
} from "../src/lib/security";
import {
  trustedBackend,
  backendPath,
  publicAddress,
} from "../src/lib/backend-policy";
import { verifyDelegation } from "../src/lib/delegation";
import { allowedMethod, allowedDoctype } from "../src/lib/operation-policy";
import { resolveTenant } from "../src/lib/tenant-resolver";
import { POST as dataList } from "../src/app/api/datalist/route";
import { POST as dashboardSave } from "../src/app/api/dashboard/save-layout/route";
import { GET as proxyGet } from "../src/app/api/proxy/[...path]/route";
import { GET as logoutGet } from "../src/app/api/auth/logout/route";
const secret = "r77-test-only-key-not-used-in-any-environment-0001";
const org = "TEAM-00076",
  backend = "https://crm.team-00076.evoq.app";
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKey = keys.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();
function session() {
  const now = Date.now();
  return {
    userId: "member@example.test",
    evoqUserKey: "USR-1",
    organization: org,
    application: "crm",
    createdAt: now,
    expiresAt: now + 3600_000,
  };
}
function request(
  path = "/api/datalist",
  method = "POST",
  body?: unknown,
  extra: Record<string, string> = {},
) {
  const raw = serializeSession(session());
  return new NextRequest("https://crm.evoq.app" + path, {
    method,
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${raw}`,
      "x-evoq-page-org": org,
      "x-evoq-csrf": csrfToken(raw),
      Origin: "https://crm.evoq.app",
      "content-type": "application/json",
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function jwt(
  changes: Record<string, unknown> = {},
  header: Record<string, unknown> = {},
) {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: "test", ...header }),
  ).toString("base64url");
  const p = Buffer.from(
    JSON.stringify({
      iss: "https://cloud.evoq.app",
      sub: "USR-1",
      org,
      app: "crm",
      aud: backend,
      scope: "tenant_delegation",
      iat: now,
      exp: now + 300,
      jti: "JTI-1",
      ...changes,
    }),
  ).toString("base64url");
  return `${h}.${p}.${sign("RSA-SHA256", Buffer.from(`${h}.${p}`), keys.privateKey).toString("base64url")}`;
}
beforeEach(() => {
  process.env.SESSION_SECRET = secret;
  process.env.CRM_PUBLIC_ORIGIN = "https://crm.evoq.app";
  process.env.INTERNAL_SERVICE_SECRET = secret;
  process.env.CENTRAL_BASE_URL = "http://127.0.0.1:8000";
  process.env.TENANT_BACKEND_HOSTS = "crm.team-00076.evoq.app";
  process.env.CENTRAL_DELEGATION_PUBLIC_KEY = publicKey;
});
test("session signing has no missing/default secret fallback", () => {
  delete process.env.SESSION_SECRET;
  assert.throws(() => sessionSecret());
  process.env.SESSION_SECRET = "evoq-crm-dev-session-signing-secret-key-32b";
  assert.throws(() => sessionSecret());
});
test("valid signed session works; MAC tamper and invalid schema/time fail", () => {
  const s = session(),
    raw = serializeSession(s);
  assert.equal(parseSession(raw)?.organization, org);
  assert.equal(parseSession(raw + "x"), null);
  for (const change of [
    { application: "inventory" },
    { organization: "TEAM-X" },
    { createdAt: Date.now() + 60_000 },
    { expiresAt: Date.now() - 100 },
    { evoqUserKey: "" },
  ])
    assert.throws(() => serializeSession({ ...s, ...change }));
  const body = Buffer.from(
    JSON.stringify({ ...s, expiresAt: "forever" }),
  ).toString("base64url");
  const bad = `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
  assert.equal(parseSession(bad), null);
});
test("mutations require exact Origin and session-bound CSRF, including same-site sibling", async () => {
  await requireContext(request());
  for (const headers of [
    { Origin: "https://evil.evoq.app" },
    { Origin: "https://outside.test" },
    { Origin: "" },
    { "x-evoq-csrf": "wrong" },
    { "sec-fetch-site": "same-site" },
  ])
    await assert.rejects(
      requireContext(
        request(
          "/api/datalist",
          "POST",
          undefined,
          headers as unknown as Record<string, string>,
        ),
      ),
      SecurityError,
    );
});
test("organization assertion is mandatory; stale/foreign org and caller credentials refused", async () => {
  for (const headers of [
    { "x-evoq-page-org": "" },
    { "x-evoq-page-org": "TEAM-00069" },
    { authorization: "token stolen" },
    { "x-evoq-user-key": "USR-2" },
  ])
    await assert.rejects(
      requireContext(
        request(
          "/api/datalist",
          "GET",
          undefined,
          headers as unknown as Record<string, string>,
        ),
      ),
      SecurityError,
    );
  await assert.rejects(
    requireContext(request("/api/datalist?org=TEAM-00069", "GET")),
    SecurityError,
  );
});
test("SSRF rejects private/address/userinfo/HTTP/ports/foreign org/unapproved mappings", () => {
  assert.equal(trustedBackend(backend, org).origin, backend);
  for (const raw of [
    "http://crm.team-00076.evoq.app",
    "https://127.0.0.1",
    "https://crm.team-00076.evoq.app:8443",
    "https://user@crm.team-00076.evoq.app",
    "https://crm.team-00069.evoq.app",
    "https://crm.team-00076.evoq.app/other",
    "https://crm.team-00076.evoq.app?x=y",
    "https://evil.test",
  ])
    assert.throws(() => trustedBackend(raw, org));
  for (const ip of [
    "127.0.0.1",
    "169.254.169.254",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.0.1",
    "100.64.1.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(publicAddress(ip), false);
  assert.equal(publicAddress("46.225.100.237"), true);
});
test("backend path rejects protocol relative, traversal and double encoded paths", () => {
  for (const path of [
    "//evil.test/api",
    "/api/../login",
    "/api/%2e%2e/login",
    "/api/%252e%252e/login",
    "/api/\\evil",
    "/api/foo#x",
  ])
    assert.throws(() => backendPath(path));
  assert.equal(
    backendPath("/api/method/frappe.client.get"),
    "/api/method/frappe.client.get",
  );
});
test("real RS256 signatures require issuer,audience,application,org,scope,subject and lifetime", () => {
  const expected = { userKey: "USR-1", organization: org, backend };
  verifyDelegation(jwt(), expected);
  for (const c of [
    { iss: "https://evil.test" },
    { iss: null },
    { aud: "https://crm.team-00069.evoq.app" },
    { app: "inventory" },
    { org: "TEAM-00069" },
    { scope: "tenant_user_sync" },
    { sub: "USR-2" },
    { exp: 0 },
    { iat: Date.now() / 1000 + 60 },
    { jti: "" },
  ])
    assert.throws(() => verifyDelegation(jwt(c), expected));
  assert.throws(() => verifyDelegation(jwt({}, { alg: "HS256" }), expected));
  assert.throws(() =>
    verifyDelegation(jwt().slice(0, -12) + "forged", expected),
  );
});
test("SDK/admin/unaudited addons and privilege Doctypes fail closed", () => {
  for (const method of [
    "sdl_user_management.sdk.api",
    "frappe.client.run",
    "sdl_metadata.api.dashboard.save_dashboard",
    "report_addon.api.insights_query.get_insights_query_result",
  ])
    assert.throws(() => allowedMethod(method, "POST"));
  for (const dt of ["User", "Role", "Role Profile", "DocType", "Server Script"])
    assert.throws(() => allowedDoctype(dt));
  assert.throws(() =>
    allowedMethod("frappe.client.delete", "GET", { doctype: "CRM Lead" }),
  );
  allowedMethod("sdl_user_management.um.me", "GET");
  allowedMethod("frappe.client.get", "GET", { doctype: "CRM Lead" });
});
test("route wrapper refuses unauthenticated API before business code; errors are non-cacheable", async () => {
  let called = false;
  const guarded = protectedHandler(async (_req: NextRequest, _context: any) => {
    called = true;
    return NextResponse.json({ ok: true });
  });
  const res = await guarded(
    new NextRequest("https://crm.evoq.app/api/test"),
    {},
  );
  assert.equal(res.status, 401);
  assert.equal(called, false);
  assert.equal(res.headers.get("cache-control"), "no-store");
});
test("actual CRM endpoints enforce auth/CSRF/org before any upstream calls", async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = (async () => {
    calls++;
    throw new Error("unexpected");
  }) as typeof fetch;
  try {
    assert.equal(
      (
        await dataList(
          new NextRequest("https://crm.evoq.app/api/datalist", {
            method: "POST",
          }),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await dashboardSave(
          request(
            "/api/dashboard/save-layout",
            "POST",
            {},
            { Origin: "https://evil.evoq.app" },
          ),
          {},
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await proxyGet(
          request("/api/proxy/api/resource/Contact", "GET", undefined, {
            "x-evoq-page-org": "TEAM-00069",
          }),
          { params: { path: ["api", "resource", "Contact"] } },
        )
      ).status,
      409,
    );
    assert.equal(calls, 0);
  } finally {
    global.fetch = original;
  }
});
test("Central resolution fails on mismatched returned identity or JWT and does not cache revocation", async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = (async () => {
    calls++;
    return new Response(
      JSON.stringify({
        message: {
          status: "success",
          data: {
            user_id: "member@example.test",
            evoq_user_key: "USR-1",
            organization: org,
            application: "crm",
            backend_url: backend,
            delegation_token: jwt(),
          },
        },
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  try {
    await resolveTenant("member@example.test", org, "crm", Date.now());
    await resolveTenant("member@example.test", org, "crm", Date.now());
    assert.equal(calls, 2);
    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          message: { status: "error", error: { code: "SESSION_REVOKED" } },
        }),
        { status: 401 },
      )) as typeof fetch;
    await assert.rejects(
      resolveTenant("member@example.test", org, "crm", Date.now()),
      (error: any) => error.code === "SESSION_REVOKED",
    );
    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          message: {
            status: "success",
            data: {
              user_id: "other@example.test",
              organization: org,
              application: "crm",
            },
          },
        }),
        { status: 200 },
      )) as typeof fetch;
    await assert.rejects(resolveTenant("member@example.test", org));
  } finally {
    global.fetch = original;
  }
});
test("GET logout is read-only; mutation requires POST", async () => {
  assert.equal((await logoutGet()).status, 405);
});

test("mass assignment cannot overwrite security/server-owned fields", () => {
  assert.throws(() =>
    allowedMethod("frappe.client.set_value", "POST", {
      doctype: "CRM Lead",
      fieldname: "owner",
      value: "Administrator",
    }),
  );
  assert.throws(() =>
    allowedMethod("frappe.client.save", "POST", {
      doc: { doctype: "CRM Lead", name: "LEAD-1", ignore_permissions: 1 },
    }),
  );
});
test("a filtered field is never silently dropped on backend schema mismatch", async () => {
  const { dropField } = await import("../src/lib/frappe-list");
  assert.throws(() =>
    dropField(
      {
        doctype: "CRM Deal",
        fields: ["name", "organization"],
        filters: [["CRM Deal", "organization", "=", "ACCOUNT-A"]],
        or_filters: [],
        order_by: "name asc",
        limit_start: 0,
        limit_page_length: 20,
      },
      "organization",
    ),
  );
});
test("real authenticated list route delegates only to resolved tenant, never returns JWT", async () => {
  const dns = (await import("node:dns/promises")).default;
  const https = (await import("node:https")).default;
  const { EventEmitter } = await import("node:events");
  const originalFetch = global.fetch,
    originalLookup = dns.lookup,
    originalRequest = https.request;
  const seen: Array<{ url: string; headers: any; body: string }> = [];
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        message: {
          status: "success",
          data: {
            user_id: "member@example.test",
            evoq_user_key: "USR-1",
            organization: org,
            application: "crm",
            backend_url: backend,
            delegation_token: jwt(),
          },
        },
      }),
      { status: 200 },
    )) as typeof fetch;
  dns.lookup = (async () => [{ address: "46.225.100.237", family: 4 }]) as any;
  https.request = ((url: any, options: any, callback: any) => {
    options.lookup("fixture", { all: true }, (error: any, addresses: any) => {
      assert.equal(error, null);
      assert.equal(addresses[0].address, "46.225.100.237");
    });
    const req: any = new EventEmitter();
    let body = "";
    req.write = (value: any) => {
      body += value.toString();
    };
    req.destroy = (error: any) => req.emit("error", error);
    req.end = () => {
      seen.push({ url: String(url), headers: options.headers, body });
      const response: any = new EventEmitter();
      response.statusCode = 200;
      response.headers = { "content-type": "application/json" };
      callback(response);
      queueMicrotask(() => {
        response.emit(
          "data",
          Buffer.from(
            JSON.stringify({
              message: String(url).includes("get_count")
                ? 1
                : [{ name: "LEAD-A", first_name: "Alice" }],
            }),
          ),
        );
        response.emit("end");
      });
    };
    return req;
  }) as any;
  try {
    const res = await dataList(
      request("/api/datalist", "POST", {
        module: "CRM Lead",
        fields: ["name", "first_name"],
        filters: [],
      }),
    );
    assert.equal(res.status, 200);
    const raw = await res.text();
    assert.match(raw, /LEAD-A/);
    assert.doesNotMatch(raw, /delegation|RS256|USR-1/);
    assert.equal(seen.length, 2);
    for (const call of seen) {
      assert.ok(call.url.startsWith(backend + "/api/"));
      assert.ok(call.headers["x-evoq-delegation-token"]);
      assert.equal(call.headers.cookie, undefined);
      assert.equal(call.headers.authorization, undefined);
    }
  } finally {
    global.fetch = originalFetch;
    dns.lookup = originalLookup;
    https.request = originalRequest;
  }
});

test("startup preflight rejects missing keys and unsafe deployment mappings", async () => {
  const { validateConfiguration } = await import("../src/lib/startup");
  validateConfiguration();
  const key = process.env.CENTRAL_DELEGATION_PUBLIC_KEY;
  delete process.env.CENTRAL_DELEGATION_PUBLIC_KEY;
  assert.throws(() => validateConfiguration());
  process.env.CENTRAL_DELEGATION_PUBLIC_KEY = key;
  process.env.TENANT_BACKEND_HOSTS = "localhost";
  assert.throws(() => validateConfiguration());
});
