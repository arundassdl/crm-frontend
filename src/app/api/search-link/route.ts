import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { txt, module,reference_doctype } = await req.json();
    const token = req.headers.get("Authorization");
    console.log("reference_doctype",reference_doctype);
    

    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${CONSTANTS.VERSION}`;
    console.log("fetchUrl",fetchUrl);


    //  const response = await axios.post(
    //   fetchUrl,
    //   {
    //     version: CONSTANTS.VERSION,
    //     method: "search_link_wrapper",
    //     entity: "datalist",
    //     txt:" ",
    //     doctype:module,
    //     ignore_user_permissions: 1,
    //     reference_doctype: reference_doctype?reference_doctype:'Dynamic Link',
    //     page_length: 10,
    //   },
    //   {
    //     headers: {
    //       Authorization: token || "",
    //       "Content-Type": "application/json"
    //     },
    //     // body: JSON.stringify({ doctype, data }),
    //   }
    // );

    const response = await fetch(
      `${fetchUrl}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify({
           version: CONSTANTS.VERSION,
        method: "search_link_wrapper",
        entity: "datalist",
          txt:" ",
          doctype:module,
          ignore_user_permissions: 1,
          reference_doctype: reference_doctype?reference_doctype:'Dynamic Link',
          page_length: 10,
        }),
      }
    );

    // const response = await fetch(
    //   `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.search.search_link`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `${token}`,
    //     },
    //     body: JSON.stringify({
    //       txt,
    //       doctype:module,
    //       ignore_user_permissions: 1,
    //       reference_doctype: reference_doctype?reference_doctype:'Dynamic Link',
    //       page_length: 10,
    //     }),
    //   }
    // );

    const data = await response.json();

    return NextResponse.json({ data: data.message || [] });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
