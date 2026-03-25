// app/api/products/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { field_filters, fields, module } = body;

    const token = req.headers.get("Authorization");
    // const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.STORE_API}.products_list.get_products_with_filters`;
    const fetchUrl = `${CONSTANTS.API_BASE_URL}/api/method/frappe.client.get_list`;

    const response = await axios.post(
      fetchUrl,
      {
        doctype:module,
        fields,
        filters: field_filters,
        limit_page_length: 20
      },
      {
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json"
        }
      }
    );

    console.log("response.data", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error fetching data:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
