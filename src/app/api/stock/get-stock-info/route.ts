import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("Authorization");
    const item_code = body.item_code; 

    if (!item_code || !token) {
      return NextResponse.json({ error: "Missing item_code or token" }, { status: 400 });
    }

    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;

    const bodyParams = {
      version: CONSTANTS.VERSION,
      method: "get_stock_summary",
      entity: "product",
      item_code,
    };

    const frappeRes = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyParams),
    });

    if (!frappeRes.ok) {
      return NextResponse.json(
        { error: `Frappe request failed with status ${frappeRes.status}` },
        { status: frappeRes.status }
      );
    }

    const data = await frappeRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
