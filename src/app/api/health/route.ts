import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      application: "salesbond-crm",
      integration: "r77-development",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
