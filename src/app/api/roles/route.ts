import { NextResponse } from "next/server";
import { protectedHandler } from "@/lib/security";
import { BffError, bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";

export const dynamic = "force-dynamic";

const METHODS = {
  modules: "sdl_metadata.api.roles.permission_modules",
  tree: "sdl_metadata.api.roles.role_tree",
  detail: "sdl_metadata.api.roles.get_role",
  list: "sdl_metadata.api.roles.list_roles",
  menu: "sdl_metadata.api.roles.menu_roles",
  timeline: "sdl_metadata.api.roles.role_timeline",
} as const;

function text(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > max)
    throw new BffError(400, "INVALID_INPUT", "validation", "Invalid role request.");
  return value.trim();
}

async function rawGET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const view = q.get("view") || "list";
    if (!(view in METHODS)) return NextResponse.json({ message: "Invalid roles view." }, { status: 400 });
    const args: Record<string, unknown> = {};
    if (view === "list") {
      args.search = text(q.get("search"), 100);
      args.start = Math.max(0, Number(q.get("start") || 0) | 0);
      args.page_length = Math.min(100, Math.max(1, Number(q.get("page_length") || 25) | 0));
    } else if (view === "detail" || view === "timeline") args.name = text(q.get("name"), 140);
    else if (view === "tree") args.flat = q.get("flat") === "1" ? 1 : 0;
    const result = await frappeCall(req, METHODS[view as keyof typeof METHODS], args, "GET");
    return NextResponse.json(result?.message ?? null, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return bffErrorResponse(error, "roles-read");
  }
}

async function body(req: Request) {
  const value = await req.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BffError(400, "INVALID_INPUT", "validation", "Invalid role request.");
  const allowed = new Set(["name", "role_name", "role_description", "permission", "reports_to", "data_share", "disabled"]);
  if (Object.keys(value).some(key => !allowed.has(key)))
    throw new BffError(400, "INVALID_INPUT", "validation", "Invalid role request.");
  return value as Record<string, unknown>;
}

async function mutate(req: Request, action: "create_role" | "update_role" | "delete_role") {
  try {
    const value = await body(req);
    const result = await frappeCall(req, `sdl_metadata.api.roles.${action}`, value);
    return NextResponse.json(result?.message ?? null);
  } catch (error) {
    return bffErrorResponse(error, `roles-${action}`);
  }
}

export const GET = protectedHandler(rawGET);
export const POST = protectedHandler(req => mutate(req, "create_role"));
export const PUT = protectedHandler(req => mutate(req, "update_role"));
export const DELETE = protectedHandler(req => mutate(req, "delete_role"));
