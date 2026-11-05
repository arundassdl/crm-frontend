import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { tenantFetch, bffErrorResponse } from "@/lib/tenant-fetch";
import { allowedMethod, allowedDoctype } from "@/lib/operation-policy";
import { SecurityError, securityResponse } from "@/lib/security";
export const dynamic = "force-dynamic";
async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const path = "/" + params.path.join("/");
    const query = Object.fromEntries(req.nextUrl.searchParams);
    let args: Record<string, any> = { ...query };
    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const bytes = await req.arrayBuffer();
      if (bytes.byteLength > 20 * 1024 * 1024)
        throw new SecurityError(413, "REQUEST_TOO_LARGE");
      body = bytes;
      const type = req.headers.get("content-type") || "";
      if (type.includes("application/json")) {
        try {
          args = { ...args, ...JSON.parse(new TextDecoder().decode(bytes)) };
        } catch {
          throw new SecurityError(400, "INVALID_JSON");
        }
      } else if (type.includes("application/x-www-form-urlencoded"))
        args = {
          ...args,
          ...Object.fromEntries(
            new URLSearchParams(new TextDecoder().decode(bytes)),
          ),
        };
      else throw new SecurityError(415, "CONTENT_TYPE_NOT_SUPPORTED");
    }
    if (path.startsWith("/api/method/"))
      allowedMethod(path.slice("/api/method/".length), req.method, args);
    else if (path.startsWith("/api/resource/")) {
      const parts = path.slice("/api/resource/".length).split("/");
      allowedDoctype(decodeURIComponent(parts[0]));
      if (!["GET", "POST", "PUT", "DELETE"].includes(req.method))
        throw new SecurityError(405, "METHOD_NOT_ALLOWED");
    } else throw new SecurityError(403, "METHOD_FORBIDDEN");
    for (const field of [
      "token",
      "access_token",
      "Joinquery",
      "whereconditon",
      "username",
      "role_profile",
    ])
      if (args[field]) throw new SecurityError(400, "UNTRUSTED_PARAMETER");
    const upstream = await tenantFetch(req, path, {
      method: req.method,
      query,
      body,
      headers: req.headers.get("content-type")
        ? { "Content-Type": req.headers.get("content-type")! }
        : {},
    });
    if (!upstream.ok)
      return NextResponse.json(
        {
          error: "BACKEND_REQUEST_REJECTED",
          message: "The request was not accepted.",
        },
        { status: upstream.status >= 500 ? 502 : upstream.status },
      );
    return new NextResponse(
      [204, 205, 304].includes(upstream.status)
        ? null
        : await upstream.arrayBuffer(),
      { status: upstream.status, headers: upstream.headers },
    );
  } catch (error) {
    return error instanceof SecurityError
      ? securityResponse(error)
      : bffErrorResponse(error, "proxy");
  }
}

export const GET = protectedHandler(proxy);
export const POST = protectedHandler(proxy);
export const PUT = protectedHandler(proxy);
export const PATCH = protectedHandler(proxy);
export const DELETE = protectedHandler(proxy);
