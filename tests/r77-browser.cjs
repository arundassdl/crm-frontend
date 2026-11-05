/** Local production-build browser harness. Central and user data are fixtures, never production. */
const assert = require("node:assert/strict");
const http = require("node:http");
const net = require("node:net");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const playwright = require(process.env.R77_PLAYWRIGHT_MODULE || "playwright");
const origin = "https://crm.evoq.test",
  ctrl = "https://ctrl.evoq.test",
  org = "TEAM-00076";
const secret = crypto.randomBytes(48).toString("hex");
const keys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const checks = [];
let revoked = false;
const consumed = new Set();
function check(label, fn) {
  fn();
  checks.push(label);
}
function token() {
  const now = Math.floor(Date.now() / 1000),
    h = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fixture" })).toString(
      "base64url",
    ),
    p = Buffer.from(
      JSON.stringify({
        iss: "https://cloud.evoq.app",
        sub: "USR-1",
        org,
        app: "crm",
        aud: "https://crm.team-00076.evoq.app",
        scope: "tenant_delegation",
        iat: now,
        exp: now + 300,
        jti: crypto.randomUUID(),
      }),
    ).toString("base64url");
  return `${h}.${p}.${crypto.sign("RSA-SHA256", Buffer.from(`${h}.${p}`), keys.privateKey).toString("base64url")}`;
}
const me = {
  user: "owner@example.test",
  email: "owner@example.test",
  full_name: "Fixture Owner",
  organization: org,
  is_manager: true,
  is_owner: true,
  enabled: true,
  role_profile: "EVOQ CRM Manager",
  roles: ["Sales User", "Sales Manager"],
};
async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server.address().port;
}
async function run() {
  const central = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    let body = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {}
    res.setHeader("content-type", "application/json");
    const respond = (status, payload) => {
      res.statusCode = status;
      res.end(JSON.stringify({ message: payload }));
    };
    if (req.headers["x-evoq-internal-secret"] !== secret)
      return respond(401, { status: "error" });
    if (req.url.endsWith("internal_launch_tickets.redeem")) {
      if (!body.ticket || consumed.has(body.ticket))
        return respond(401, {
          status: "error",
          code: "TICKET_INVALID_OR_EXPIRED",
        });
      consumed.add(body.ticket);
      revoked = false;
      return respond(200, {
        status: "success",
        session: {
          user_id: me.user,
          evoq_user_key: "USR-1",
          organization: org,
          application: "crm",
          callback_path: `/org/${org}/user/users`,
        },
      });
    }
    if (req.url.endsWith("internal_tenant_resolver.resolve")) {
      if (revoked)
        return respond(401, {
          status: "error",
          error: { code: "SESSION_REVOKED" },
        });
      return respond(200, {
        status: "success",
        data: {
          user_id: me.user,
          evoq_user_key: "USR-1",
          organization: org,
          application: "crm",
          backend_url: "https://crm.team-00076.evoq.app",
          delegation_token: token(),
        },
      });
    }
    if (req.url.endsWith("internal_session.global_logout")) {
      revoked = true;
      return respond(200, { status: "success" });
    }
    respond(404, { status: "error" });
  });
  const centralPort = await listen(central);
  const reserve = net.createServer();
  const nextPort = await listen(reserve);
  await new Promise((r) => reserve.close(r));
  const log = fs.openSync("/tmp/r77-next-browser-server.log", "w");
  const next = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "-H",
      "127.0.0.1",
      "-p",
      String(nextPort),
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        NODE_ENV: "production",
        SESSION_SECRET: secret,
        INTERNAL_SERVICE_SECRET: secret,
        CENTRAL_BASE_URL: `http://127.0.0.1:${centralPort}`,
        CENTRAL_SITE_HOST: "cloud.evoq.app",
        CRM_PUBLIC_ORIGIN: origin,
        TENANT_BACKEND_HOSTS: "crm.team-00076.evoq.app",
        CENTRAL_DELEGATION_PUBLIC_KEY: keys.publicKey
          .export({ type: "spki", format: "pem" })
          .toString(),
      },
      stdio: ["ignore", log, log],
    },
  );
  let browser;
  try {
    for (let i = 0; i < 100; i++) {
      if (next.exitCode !== null)
        throw new Error(
          "Local Next server exited; inspect /tmp/r77-next-browser-server.log",
        );
      try {
        if ((await fetch(`http://127.0.0.1:${nextPort}/api/health`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
      if (i === 99) throw new Error("Local Next server did not become ready");
    }
    const imageProbe = await fetch(
      `http://127.0.0.1:${nextPort}/_next/image?url=http%3A%2F%2F127.0.0.1%3A8012%2Fsecret&w=64&q=75`,
    );
    check("Next image optimizer rejects inherited wildcard SSRF path", () =>
      assert.equal(imageProbe.status, 400),
    );
    for (const name of ["chromium", "firefox"]) {
      browser = await playwright[name].launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const calls = [];
      const unexpected = [];
      await context.route("**/*", async (route) => {
        const req = route.request(),
          url = new URL(req.url());
        if (url.origin === ctrl && url.pathname === "/launch-fixture")
          return route.fulfill({
            contentType: "text/html",
            body: `<a id="launch" href="${origin}/api/auth/launch?ticket=${url.searchParams.get("ticket")}">Launch CRM</a>`,
          });
        if (url.origin === ctrl)
          return route.fulfill({
            contentType: "text/html",
            body: `<html><body><iframe title="CRM" src="${origin}/org/${org}/user/users" style="width:100%;height:900px"></iframe></body></html>`,
          });
        if (url.origin !== origin) {
          unexpected.push(url.origin);
          return route.abort();
        }
        if (
          url.pathname === "/api/account/me" ||
          url.pathname.startsWith("/api/user-management/")
        ) {
          const headers = req.headers();
          calls.push({ path: url.pathname, headers });
          if (headers["x-evoq-page-org"] !== org)
            return route.fulfill({
              status: 409,
              json: { error: "ORGANIZATION_CHANGED" },
            });
          let data = me;
          if (url.pathname.endsWith("/users"))
            data = {
              users: [
                me,
                {
                  user: "member@example.test",
                  full_name: "Fixture Member",
                  email: "member@example.test",
                  enabled: true,
                  is_owner: false,
                  role_profile: "EVOQ CRM User",
                },
              ],
              total: 2,
              start: 0,
              page_length: 20,
            };
          if (url.pathname.endsWith("/role-profiles"))
            data = [
              {
                role_profile: "EVOQ CRM User",
                roles: ["Sales User"],
                available: true,
              },
              {
                role_profile: "EVOQ CRM Manager",
                roles: ["Sales User", "Sales Manager"],
                available: true,
              },
            ];
          return route.fulfill({ json: data });
        }
        const forwarded = await req.allHeaders();
        if (url.searchParams.has("__r77_invalid_csrf"))
          forwarded["x-evoq-csrf"] = "wrong";
        const response = await route.fetch({
          url: `http://127.0.0.1:${nextPort}${url.pathname}${url.search}`,
          headers: {
            ...forwarded,
            host: "crm.evoq.test",
            "x-forwarded-proto": "https",
            "x-forwarded-host": "crm.evoq.test",
          },
          maxRedirects: 0,
        });
        const headers = { ...response.headers() };
        if (headers.location?.startsWith("http://"))
          headers.location = headers.location.replace(
            /^http:\/\/[^/]+/,
            origin,
          );
        if (headers["content-security-policy"])
          headers["content-security-policy"] = headers[
            "content-security-policy"
          ].replaceAll("https://ctrl.evoq.app", ctrl);
        if (headers.location) {
          const location = headers.location;
          delete headers.location;
          delete headers["content-length"];
          delete headers["content-encoding"];
          return route.fulfill({
            status: 200,
            headers: { ...headers, "content-type": "text/html" },
            body: `<script>location.replace(${JSON.stringify(location)})</script>`,
          });
        }
        const body = await response.body();
        delete headers["content-encoding"];
        delete headers["content-length"];
        delete headers["transfer-encoding"];
        if (url.pathname.startsWith("/org/"))
          console.log(
            "Org response",
            response.status(),
            headers["content-type"],
            body.length,
          );
        return route.fulfill({ status: response.status(), headers, body });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) =>
        console.error("Browser runtime:", error.message),
      );
      await page.goto(ctrl + "/launch-fixture?ticket=" + name + "-ticket");
      await page.locator("#launch").click();
      try {
        await page
          .getByText("Fixture Member", { exact: true })
          .waitFor({ timeout: 30000 });
      } catch (error) {
        console.error(
          "Rendered path:",
          new URL(page.url()).pathname,
          "body:",
          (await page.locator("body").innerText()).slice(0, 1800),
          "API paths:",
          calls.map((c) => c.path),
        );
        fs.writeFileSync("/tmp/r77-browser-failure.html", await page.content());
        await page.screenshot({ path: "/tmp/r77-browser-failure.png" });
        throw error;
      }
      check(name + ": standalone launch renders secured users fixture", () =>
        assert.match(page.url(), /org\/TEAM-00076\/user\/users/),
      );
      const cookies = await context.cookies(origin),
        session = cookies.find((c) => c.name === "evoq_crm_session");
      check(name + ": session cookie HttpOnly Secure host-only Lax", () => {
        assert.ok(session?.httpOnly && session.secure);
        assert.equal(session.domain, "crm.evoq.test");
        assert.equal(session.sameSite, "Lax");
      });
      const exposed = await page.evaluate(() => ({
        cookie: document.cookie,
        local: JSON.stringify(localStorage),
        session: JSON.stringify(sessionStorage),
      }));
      check(
        name + ": browser storage has no session or authentication token",
        () => {
          assert.doesNotMatch(exposed.cookie, /evoq_crm_session/);
          assert.doesNotMatch(
            exposed.local + exposed.session,
            /access_token|delegationToken|evoq_crm_session/,
          );
        },
      );
      const replay = await page.evaluate(
        async (ticket) =>
          (await fetch("/api/auth/launch?ticket=" + ticket)).status,
        name + "-ticket",
      );
      check(name + ": launch ticket replay rejected", () =>
        assert.equal(replay, 401),
      );
      const denied = await page.evaluate(async () => ({
        csrf: (
          await fetch("/api/datalist?__r77_invalid_csrf=1", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-evoq-csrf": "wrong",
            },
            body: "{}",
          })
        ).status,
        org: (await fetch("/api/proxy/api/resource/Contact?org=TEAM-00069"))
          .status,
      }));
      check(
        name + ": browser CSRF and foreign organization requests rejected",
        () => {
          assert.equal(denied.csrf, 403);
          assert.equal(denied.org, 403);
        },
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      await page.getByText("Fixture Member", { exact: true }).waitFor();
      check(name + ": mobile secured users page renders", () =>
        assert.equal(page.viewportSize().width, 390),
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(ctrl + "/apps/crm");
      const frame = page.frameLocator("iframe");
      await frame
        .getByText("Fixture Member", { exact: true })
        .waitFor({ timeout: 30000 });
      check(name + ": CTRL iframe renders with approved frame ancestors", () =>
        assert.ok(
          calls.length > 0 && calls.every((c) => !c.headers.authorization),
        ),
      );
      const cookieBefore = session.value;
      const result = await frame.locator("body").evaluate(async () => {
        const context = await fetch("/api/auth/context").then((r) => r.json());
        const out = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "x-evoq-csrf": context.csrf },
        });
        return out.status;
      });
      check(name + ": global logout succeeds", () => assert.equal(result, 200));
      await context.addCookies([
        {
          name: "evoq_crm_session",
          value: cookieBefore,
          domain: "crm.evoq.test",
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
        },
      ]);
      const revokedStatus = await frame
        .locator("body")
        .evaluate(async () => (await fetch("/api/auth/context")).status);
      check(
        name + ": copied pre-logout session refused by Central cutoff",
        () => assert.equal(revokedStatus, 401),
      );
      check(name + ": harness never accessed a production origin", () =>
        assert.deepEqual(unexpected, []),
      );
      await context.close();
      await browser.close();
      browser = null;
    }
    fs.writeFileSync(
      "/tmp/r77-browser-results.json",
      JSON.stringify(
        {
          checks: checks.length,
          passed: checks,
          limitations:
            "Local production build with .test proxy origins and redirect/CSP origin adaptation; fixture Central and browser-intercepted user data, no live Frappe or customer credentials.",
        },
        null,
        2,
      ),
    );
    console.log(
      `Passed ${checks.length} browser checks (Chromium + Firefox; local fixtures only).`,
    );
  } finally {
    if (browser) await browser.close();
    next.kill("SIGTERM");
    await new Promise((r) => central.close(r));
    fs.closeSync(log);
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
