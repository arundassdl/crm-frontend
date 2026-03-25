import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: NextRequest) {
  try {
    const { name, new_qty, item_code, warehouse, cost_price, company  } = await req.json();
    const token = req.headers.get("Authorization");
 
    if (!new_qty || !token) {
      return NextResponse.json({ error: "Missing new_qty" }, { status: 400 });
    }
    console.log("original name",name);
    
    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;

    const bodyParams = {
      version: CONSTANTS.VERSION,
      method: "update_stock",
      entity: "product",
      original_name:name,
      new_qty,
      item_code,
      warehouse,
      cost_price,
      company

    };
console.log("bodyParams",bodyParams);

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
    return NextResponse.json(data?.message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
