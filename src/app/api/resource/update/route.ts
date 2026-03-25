export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const { doctype, name, updateData, token } = body;

    if (!doctype || !name || !updateData ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const result = await updateResource(doctype, name, updateData, token);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Update Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
