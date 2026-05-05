export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchFromERPNext } from "@/services/api/common-erpnext-api/listing-api-get";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { module,  filters,fields } = body;

    const dataParams = {
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters) ,
    };

    const token = req.headers.get("authorization");
    const item_code = body.item_code;

    if (!item_code || !token) {
      return NextResponse.json({ error: "Missing item_code or token" }, { status: 400 });
    }

    // ERPNext endpoint
    // const url = `${CONSTANTS.API_BASE_URL}/api/resource/Item Price?fields=["price_list","price_list_rate"]&filters=[["item_code","=","${item_code}"]]`;


    const result = await fetchFromERPNext(module, dataParams, token);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

