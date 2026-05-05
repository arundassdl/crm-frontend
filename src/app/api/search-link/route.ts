import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { txt, module, reference_doctype, filters, search_fields, display_fields } = await req.json();
    const token = req.headers.get("Authorization");

    const fetchUrl = `${CONSTANTS.API_BASE_URL}/api/method/sdl_metadata.api.lookup.search`;
    console.log("fetchUrl", fetchUrl);
    const body = {
      doctype: module,
      search_text: txt,
      search_fields: Array.isArray(search_fields) ? search_fields.join(',') : search_fields || "",
      display_fields: Array.isArray(display_fields) ? display_fields.join(',') : display_fields || "",
      filters: filters || {},
      page: 1,
      page_length: 20
    };
    console.log("body", body);
    console.log("token", token);

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lookup API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json({ error: `Backend API error: ${response.status}`, details: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log("Lookup API Response Data:", data);

    return NextResponse.json({ data: data?.message?.results || [] });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
  }
}
