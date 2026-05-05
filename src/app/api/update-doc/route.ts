export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      doctype,
      name,
      data
    } = body;
    const token = req.headers.get("Authorization");
 

    if (!doctype || !name) {
      return NextResponse.json({ error: "Missing doctype or name" }, { status: 400 });
    }

    // console.log("fields (raw):", fields);

    //  Ensure fields is an array
    // if (!Array.isArray(data)) {
    //   return NextResponse.json({ error: "Fields must be an array" }, { status: 400 });
    // }

    //  API call to ERPNext
    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${CONSTANTS.VERSION}`;
    console.log("fetchUrl",fetchUrl);


     const response = await axios.post(
      fetchUrl,
      {
        version: CONSTANTS.VERSION,
        method: "update_document",
        entity: "datalist",
        doctype,
        name,
        data
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
    
  } catch (error: any) {
    console.error('[UpdateDocumentError]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
