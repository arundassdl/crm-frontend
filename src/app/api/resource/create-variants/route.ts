import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = req.headers.get("Authorization");

  const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;
  const bodyParams = {
    version: CONSTANTS.VERSION,
    method: "create_item_variants",
    entity: "product",
  };

  const frappeRes = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...bodyParams,
      variants: JSON.stringify(body.variants), // ✅ double encode the list
    }),
  });

  // Handle timeout or non-2xx status codes gracefully
  if (!frappeRes.ok) {
    return NextResponse.json(
      { error: `Frappe request failed with status ${frappeRes.status}` },
      { status: frappeRes.status }
    );
  }

  const data = await frappeRes.json();
  return NextResponse.json(data);
}
