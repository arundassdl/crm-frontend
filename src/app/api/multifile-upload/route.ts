import { allowedDoctype } from "@/lib/operation-policy";
import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import {
  backendError,
  bffErrorResponse,
  frappeCall,
  tenantFetch,
} from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/** Upload a file and attach it to a record (R55) via Frappe upload_file. */
async function rawPOST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", kind: "failed", message: "Invalid upload." },
      { status: 400 },
    );
  }
  const file = formData.get("file") as File | null;
  const attachedToDoctype = formData.get("attached_to_doctype") as string;
  const attachedToName = formData.get("attached_to_name") as string;
  const folder = (formData.get("folder") as string) || "Home";
  const isPrivate = (formData.get("is_private") as string) || "0";
  const attachedToField = formData.get("attached_to_field") as string;

  if (!file || !isValidDoctype(attachedToDoctype) || !attachedToName) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        kind: "failed",
        message: "Missing required fields",
      },
      { status: 400 },
    );
  }

  try {
    allowedDoctype(attachedToDoctype);
  } catch {
    return NextResponse.json({ error: "DOCTYPE_FORBIDDEN" }, { status: 403 });
  }
  if (
    file.size > 10 * 1024 * 1024 ||
    ![
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
    ].includes(file.type)
  )
    return NextResponse.json({ error: "FILE_NOT_PERMITTED" }, { status: 422 });
  const uploadForm = new FormData();
  uploadForm.append("file", file, file.name);
  uploadForm.append("attached_to_doctype", attachedToDoctype);
  uploadForm.append("attached_to_name", attachedToName);
  uploadForm.append("folder", folder);
  uploadForm.append("is_private", "1");
  if (attachedToField) {
    uploadForm.append("attached_to_field", attachedToField);
  } else {
    uploadForm.append("doctype", attachedToDoctype);
    uploadForm.append("docname", attachedToName);
  }

  try {
    // Prove record visibility before sending any bytes. Frappe's upload_file
    // performs the write check when attaching the private File document.
    await frappeCall(req, "frappe.client.get", {
      doctype: attachedToDoctype,
      name: attachedToName,
    });
    const res = await tenantFetch(req, "/api/method/upload_file", {
      method: "POST",
      body: uploadForm,
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw backendError(res.status, result);

    if (
      attachedToField &&
      /^[A-Za-z0-9_]+$/.test(attachedToField) &&
      result?.message?.file_url
    ) {
      await frappeCall(req, "frappe.client.set_value", {
        doctype: attachedToDoctype,
        name: attachedToName,
        fieldname: attachedToField,
        value: result.message.file_url,
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    return bffErrorResponse(err, "multifile-upload");
  }
}

export const POST = protectedHandler(rawPOST);
