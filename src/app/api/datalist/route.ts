export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      module: doctype,
      fields,
      filters,
      limit_start = "0",
      limit_page_length = "20",
      order_by = "modified desc",
      related,
      token,
      include_contact = "False",
      include_address = "False",
      Joinquery,
      whereconditon,
      role_profile,
      username
    } = body;

    if (!doctype || !fields) {
      return NextResponse.json({ error: "Missing doctype or fields" }, { status: 400 });
    }

    // console.log("fields (raw):", fields);

    //  Ensure fields is an array
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Fields must be an array" }, { status: 400 });
    }

    //  API call to ERPNext
    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;

    const response = await axios.post(
      fetchUrl,
      {
        version: CONSTANTS.VERSION,
        method: "get_datagrid_list",
        entity: "datalist",
        doctype,
        fields,
        filters,
        limit_start,
        limit_page_length,
        order_by,
        related_doctypes: related,
        include_contact,
        include_address,
        Joinquery,
        whereconditon,
        role_profile,
        username
      },
      {
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json(response.data.message);
  } catch (error: any) {
    console.error("Error fetching data:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
