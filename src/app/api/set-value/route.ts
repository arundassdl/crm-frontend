import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
import axios from 'axios';

const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const { doctype, fieldname, name, value } = await req.json();
    const token = req.headers.get("Authorization");

    if (!doctype || !fieldname || !name || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: doctype, fieldname, name, value" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${CONSTANTS.VERSION}`;
    console.log("fetchUrl",fetchUrl);


     const response = await axios.post(
      fetchUrl,
      {
        version: CONSTANTS.VERSION,
        method: "set_value",
        entity: "datalist",
        doctype,
        fieldname,
        name,
        value,
      },
      {
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json"
        },
        // body: JSON.stringify({ doctype, data }),
      }
    );
     return NextResponse.json(response.data.message);

    // const res = await fetch(`${ERP_API_BASE}/api/method/frappe.client.set_value`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   body: JSON.stringify({
    //     doctype,
    //     fieldname,
    //     name,
    //     value,
    //   }),
    // });

    // const data = await res.json();

    // if (!res.ok) {
    //   return NextResponse.json(
    //     { error: data.message || 'Failed to update field' },
    //     { status: res.status }
    //   );
    // }
   
    // return NextResponse.json({
    //   message: 'Field updated successfully',
    //   data,
    // });
  } catch (err: any) {
    console.error("API handler error:", err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
