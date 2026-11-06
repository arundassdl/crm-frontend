import { allowedDoctype } from "@/lib/operation-policy";
import { protectedHandler } from "@/lib/security";
import {
  bffErrorResponse,
  frappeCall,
  tenantFetch,
} from "@/lib/tenant-fetch";
import { NextRequest, NextResponse } from "next/server";

async function rawGET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name || name.length > 140 || /[\\/\x00-\x1f]/.test(name))
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  try {
    const loaded = await frappeCall(req, "frappe.client.get", {
      doctype: "File",
      name,
    });
    const file = loaded?.message;
    if (
      file?.is_private !== 1 ||
      typeof file.file_url !== "string" ||
      typeof file.attached_to_doctype !== "string" ||
      typeof file.attached_to_name !== "string"
    )
      return NextResponse.json({ error: "FILE_NOT_PERMITTED" }, { status: 403 });
    allowedDoctype(file.attached_to_doctype);
    await frappeCall(req, "frappe.client.get", {
      doctype: file.attached_to_doctype,
      name: file.attached_to_name,
    });
    const match = /^\/private\/files\/([^/]+)$/.exec(file.file_url);
    if (!match)
      return NextResponse.json({ error: "FILE_NOT_PERMITTED" }, { status: 403 });
    let safeName: string;
    try {
      safeName = decodeURIComponent(match[1]);
    } catch {
      return NextResponse.json({ error: "FILE_NOT_PERMITTED" }, { status: 403 });
    }
    if (!safeName || safeName === "." || safeName === ".." || /[\\/\x00-\x1f]/.test(safeName))
      return NextResponse.json({ error: "FILE_NOT_PERMITTED" }, { status: 403 });
    const upstream = await tenantFetch(
      req,
      `/private/files/${encodeURIComponent(safeName)}`,
      { method: "GET" },
    );
    if (!upstream.ok)
      return NextResponse.json(
        { error: "FILE_REQUEST_REJECTED" },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    const headers = new Headers();
    for (const header of ["content-type", "content-length", "content-disposition", "etag", "last-modified"]) {
      const value = upstream.headers.get(header);
      if (value) headers.set(header, value.replace(/[\r\n]/g, ""));
    }
    headers.set("cache-control", "private, no-store");
    headers.set("x-content-type-options", "nosniff");
    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers,
    });
  } catch (error) {
    return bffErrorResponse(error, "private-file-download");
  }
}

export const GET = protectedHandler(rawGET);
