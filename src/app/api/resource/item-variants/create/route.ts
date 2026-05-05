export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { item_code, attributes } = body;
    const token = req.headers.get("Authorization");

    if (!item_code || !attributes) {
      return NextResponse.json(
        { error: "Missing item_code or attributes" },
        { status: 400 }
      );
    }

    // 🔄 Convert to URL-encoded string as Frappe expects
    const formBody = new URLSearchParams({
      item: item_code,
      args: JSON.stringify(attributes),
    }).toString();

    const res = await fetch(
      `${CONSTANTS.API_BASE_URL}/api/method/erpnext.controllers.item_variant.enqueue_multiple_variant_creation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
          Authorization: `${token}`,
        },
        body: formBody,
      }
    );

    const data = await res.json();

    if (!res.ok || data?.exc_type) {
      return NextResponse.json(
        {
          error: "Variant creation failed on Frappe server",
          frappeError: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Variants enqueued successfully",
      frappeResponse: data,
    });
  } catch (error: any) {
    console.error("Variant API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
