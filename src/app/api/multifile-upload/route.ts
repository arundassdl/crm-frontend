// app/api/frappe/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as Blob;
  const attachedToDoctype = formData.get("attached_to_doctype") as string;
  const attachedToName = formData.get("attached_to_name") as string;
  const folder = (formData.get("folder") as string) || "Home";
  const is_private = formData.get("is_private") || "0";
  const token = req.headers.get("Authorization");
  const attachedToField = formData.get("attached_to_field") as string;

  if (!file || !attachedToDoctype || !attachedToName) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, (file as File).name);
  // uploadForm.append("doctype", attachedToDoctype);
  // uploadForm.append("docname", attachedToName);
  
  uploadForm.append("attached_to_doctype", attachedToDoctype);
  uploadForm.append("attached_to_name", attachedToName);
  uploadForm.append("folder", folder);
  uploadForm.append("is_private", is_private);
  if (attachedToField) {
    uploadForm.append("attached_to_field", attachedToField);
  }else{
    uploadForm.append("doctype", attachedToDoctype);
    uploadForm.append("docname", attachedToName);
  }
console.log("uploadForm",uploadForm);

  const res = await fetch(`${ERP_API_BASE}/api/method/upload_file`, {
    method: "POST",
    body: uploadForm,
    headers: {
      Authorization: `${token}`,
    },
  });

  const result = await res.json();

// Manual update ONLY if you didn't use attachedToField in the upload
// (this block should now be disabled in your case)
if (attachedToField ) {
  const file_url = result?.message?.file_url;

  await fetch(
    `${ERP_API_BASE}/api/resource/${attachedToDoctype}/${attachedToName}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({
        [attachedToField]: file_url,
      }),
    }
  );
}
  
  return NextResponse.json(result);
}
