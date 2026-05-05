export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      doctype,
      docname,
      linked_docname=""
    } = body;
    const token = req.headers.get("Authorization");
 

    if (!doctype || !docname) {
      return NextResponse.json({ error: "Missing doctype or name" }, { status: 400 });
    }
   
    const version = CONSTANTS.VERSION;
    const method = 'get_record_with_links';
    const entity = 'datalist';
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

    const response = await axios.get(
      url, 
      {
        params: { doctype: doctype, docname: docname,linked_docname:linked_docname },
        headers: { Authorization: `${token}` },
      }
    );

    return NextResponse.json(response.data.message);
    
  } catch (error: any) {
    console.error('[UpdateDocumentError]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
