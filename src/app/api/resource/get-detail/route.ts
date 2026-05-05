export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { CONSTANTS } from "@/services/config/app-config";

const API_BASE_URL = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { module, linkField, linkValue, fields = ["*"] } = body;
    const token = req.headers.get("Authorization");

    if (!module || !linkField || !linkValue || !token) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const filters = JSON.stringify({ [linkField]: linkValue });
    const encodedFields = JSON.stringify(fields);

    const frappeResponse = await fetch(
      `${API_BASE_URL}/api/resource/${module}?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(encodedFields)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    const data = await frappeResponse.json();

    return NextResponse.json(data.data || []);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
