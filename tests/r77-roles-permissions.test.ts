import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { allowedMethod } from "../src/lib/operation-policy";
import { submit_addroles, submit_editroles, delete_role } from "../src/services/api/roles/roles-api";
import { savePermissionsMatrix } from "../src/services/api/permissions/permissions-api";
import { validProfile, validUser } from "../src/lib/user-management";

test("role and permission UI cannot read or transmit browser credentials", async () => {
  const files = [
    "src/components/roles/Listing.tsx", "src/components/roles/createrole.tsx",
    "src/components/roles/Treeview.tsx", "src/components/roles/RoleDetail.tsx",
    "src/components/roles/Detail/Overview.tsx", "src/components/roles/Detail/RoleDetailTimeline.tsx",
    "src/components/roles/PermissionMatrix.tsx", "src/services/api/roles/roles-api.ts",
    "src/services/api/permissions/permissions-api.ts",
  ];
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /readAccessToken|access_token|Authorization\s*:|localStorage\.getItem\(['"](?:token|userpermission)/);
  }
});

test("BFF policy exposes only certified role operations with correct verbs", () => {
  allowedMethod("sdl_metadata.api.roles.list_roles", "GET");
  allowedMethod("sdl_metadata.api.roles.permission_matrix", "GET");
  allowedMethod("sdl_metadata.api.roles.create_role", "POST");
  allowedMethod("sdl_metadata.api.roles.save_permission_matrix", "POST");
  assert.throws(() => allowedMethod("sdl_metadata.api.roles.create_role", "GET"));
  assert.throws(() => allowedMethod("sdl_user_management.sdk.api", "POST"));
  assert.throws(() => allowedMethod("sdl_metadata.api.roles.grant_super_admin", "POST"));
});

test("user role assignment accepts only approved tenant profiles", () => {
  assert.equal(validUser("member@example.test"), "member@example.test");
  assert.equal(validProfile("EVOQ CRM User"), "EVOQ CRM User");
  assert.equal(validProfile("EVOQ CRM Manager"), "EVOQ CRM Manager");
  assert.throws(() => validProfile("Administrator"));
  assert.throws(() => validProfile("System Manager"));
  assert.throws(() => validUser("TEAM-OTHER/member"));
});

test("role mutations discard browser identity and administrative escalation fields", async () => {
  const original = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit; body: any }> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push({ url: String(url), init, body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify({ msg: "Role operation completed" }), { status: 200 });
  }) as typeof fetch;
  try {
    const unsafe = {
      name: "ROLE-1", role_name: "Sales", role_description: "Sales role", permission: "[]",
      is_admin: 1, app_code: "OTHER", username: "attacker@example.test", useremailid: "attacker@example.test",
    };
    assert.equal((await submit_addroles(unsafe)).msg, "success");
    assert.equal((await submit_editroles(unsafe)).msg, "success");
    assert.equal((await delete_role({ name: "ROLE-1", is_admin: 1 })).msg, "success");
    for (const call of calls) {
      assert.equal(call.init?.credentials, "same-origin");
      assert.equal((call.init?.headers as Record<string, string>)?.Authorization, undefined);
      assert.equal(call.body?.is_admin, undefined);
      assert.equal(call.body?.app_code, undefined);
      assert.equal(call.body?.username, undefined);
      assert.equal(call.body?.useremailid, undefined);
    }
  } finally { globalThis.fetch = original; }
});

test("permission revocation sends the complete signed-session matrix without a token", async () => {
  const original = globalThis.fetch;
  let captured: any;
  globalThis.fetch = (async (url, init) => {
    captured = { url, init, body: JSON.parse(String(init?.body)) };
    return new Response(JSON.stringify({ message: { msg: "success" } }), { status: 200 });
  }) as typeof fetch;
  try {
    const matrix = { Leads: { Sales: { fullAccess: false, create: false, read: false, update: false, delete: false, print: false, import: false, export: false, email: false, dataSharing: "Private" as const } } };
    await savePermissionsMatrix(undefined, matrix);
    assert.equal(captured.url, "/api/roles/permissions");
    assert.deepEqual(captured.body.matrix, matrix);
    assert.equal(captured.init.credentials, "same-origin");
  } finally { globalThis.fetch = original; }
});
