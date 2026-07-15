export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      doctype,
      data
    } = body;
    const token = req.headers.get("Authorization");
console.log("token",token);

    if (!doctype || !data) {
      return NextResponse.json({ error: "Missing doctype or data" }, { status: 400 });
    }

    // console.log("fields (raw):", fields);

    //  Ensure fields is an array
    // if (!Array.isArray(data)) {
    //   return NextResponse.json({ error: "Fields must be an array" }, { status: 400 });
    // }

    //  API call to ERPNext
    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${CONSTANTS.VERSION}&method=create_document&entity=datalist`;
    console.log("fetchUrl",fetchUrl);
    
//      const frappeResponse = await fetch(`${fetchUrl}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `${token}`,
//       },
//       body: JSON.stringify({ doctype, data }),
//     });

//     const result = await frappeResponse.json();
//  console.log("frappeResponse",frappeResponse);
//      if (!frappeResponse.ok) {
//       return NextResponse.json({ error: result.message || 'Failed to create document' }, { status: 400 });
//     }

//     return NextResponse.json(result.message || result);


     const response = await axios.post(
      fetchUrl,
      {
        version: CONSTANTS.VERSION,
        method: "create_document",
        entity: "datalist",
        doctype,
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
console.log("response",response);
    return NextResponse.json(response.data.message);
    
  } catch (error: any) {
    console.error('[CreateDocumentError]', error?.response?.data || error);
    // Forward ERPNext's failure details (e.g. `_server_messages`, exception message)
    // so the client can show why the document was not created instead of a blank 500.
    const upstream = error?.response?.data;
    const status = error?.response?.status || 500;
    return NextResponse.json(
      upstream || { error: 'Internal Server Error' },
      { status }
    );
  }
}
