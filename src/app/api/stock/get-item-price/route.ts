import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("authorization");
    const item_code = body.item_code;

    if (!item_code || !token) {
      return NextResponse.json({ error: "Missing item_code or token" }, { status: 400 });
    }

    // ERPNext endpoint
    const url = `${CONSTANTS.API_BASE_URL}/api/resource/Item Price?fields=["price_list","price_list_rate"]&filters=[["item_code","=","${item_code}"]]`;

    const frappeRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    if (!frappeRes.ok) {
      return NextResponse.json(
        { error: `ERP request failed with status ${frappeRes.status}` },
        { status: frappeRes.status }
      );
    }

    const data = await frappeRes.json();

    // Separate buying and selling prices
    const prices = data.data.reduce(
      (acc: any, item: any) => {
        if (item.price_list.toLowerCase().includes('selling')) {
          acc.selling = item.price_list_rate;
        } else if (item.price_list.toLowerCase().includes('buying')) {
          acc.buying = item.price_list_rate;
        }
        return acc;
      },
      { buying: null, selling: null }
    );

    return NextResponse.json({ message: prices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
