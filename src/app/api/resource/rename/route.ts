export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { renameDoc } from "@/services/api/common-erpnext-api/create-edit-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { doctype,payload, token } = body;

    if (!doctype || !payload || !token) {
      return NextResponse.json(
        { success: false, message: "Missing payload or token." },
        { status: 400 }
      );
    }

    const renamed = await renameDoc(doctype,payload, token);

    if (!renamed || !renamed.new_name) {
      return NextResponse.json(
        { success: false, message: "Rename failed or no changes made." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document renamed successfully.",
      data: renamed,
    });
  } catch (error: any) {
    console.error("Rename API error:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
