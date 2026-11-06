import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { postConvertLead } from "../src/services/api/crm/lead-convert-api";

const workflowFiles = [
  "src/app/leads/convert/[slug]/page.tsx",
  "src/components/Leads/convert/LeadConvertForm.tsx",
  "src/services/api/crm/lead-convert-api.ts",
  "src/services/api/crm/lead-convert-duplicate-api.ts",
];

test("lead conversion workflow cannot read or transmit browser credentials", async () => {
  for (const file of workflowFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /readAccessToken|localStorage|sessionStorage|Authorization\s*:/);
  }
});

test("successful conversion uses the signed-session BFF and preserves conversion options", async () => {
  const original = globalThis.fetch;
  let captured: { input?: unknown; init?: RequestInit } = {};
  globalThis.fetch = (async (input, init) => {
    captured = { input, init };
    return new Response(JSON.stringify({ message: { success: true, deal: "CRM-DEAL-1" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const result = await postConvertLead({
      lead_id: "CRM-LEAD-1", create_account: true, create_contact: true, create_deal: true,
      account_name: "EVOQ", contact_name: "Test User", existing_account: "CRM-ORG-1",
      deal_field_data: { deal_name: "Qualified opportunity", amount: "1250" },
    });
    assert.equal(captured.input, "/api/leads/convert");
    assert.equal(captured.init?.credentials, "same-origin");
    assert.equal((captured.init?.headers as Record<string, string>)?.Authorization, undefined);
    const body = JSON.parse(String(captured.init?.body));
    assert.equal(JSON.parse(body.options).existing_account, "CRM-ORG-1");
    assert.deepEqual(body.deal_value, [
      { fieldname: "deal_name", value: "Qualified opportunity" },
      { fieldname: "amount", value: 1250 },
    ]);
    assert.equal(result.data.message?.deal, "CRM-DEAL-1");
  } finally { globalThis.fetch = original; }
});

test("conversion failure is surfaced and a later retry remains possible", async () => {
  const original = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = (async () => {
    attempts += 1;
    return attempts === 1
      ? new Response(JSON.stringify({ message: "Permission denied" }), { status: 403 })
      : new Response(JSON.stringify({ message: { success: true, contact: "CONTACT-1" } }), { status: 200 });
  }) as typeof fetch;
  const payload = { lead_id: "CRM-LEAD-2", create_account: false, create_contact: true, create_deal: false };
  try {
    await assert.rejects(postConvertLead(payload), /Permission denied/);
    const retry = await postConvertLead(payload);
    assert.equal(retry.data.message?.contact, "CONTACT-1");
    assert.equal(attempts, 2);
  } finally { globalThis.fetch = original; }
});
