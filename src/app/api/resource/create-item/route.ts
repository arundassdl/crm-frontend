import { protectedHandler } from "@/lib/security";
import { NextResponse } from "next/server";
const unavailable = async () =>
  NextResponse.json(
    {
      error: "FEATURE_BACKEND_NOT_VERIFIED",
      message:
        "This feature requires a verified organization backend capability.",
    },
    { status: 501 },
  );

export const GET = protectedHandler(unavailable);
export const POST = protectedHandler(unavailable);
export const DELETE = protectedHandler(unavailable);
