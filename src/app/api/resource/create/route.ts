export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createResource } from "@/services/api/common-erpnext-api/create-edit-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { module, formData, token, links } = body;

    const result = await createResource(module, formData, token, links);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

