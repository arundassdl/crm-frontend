import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const contactName = searchParams.get('contact');

  if (!contactName) {
    return NextResponse.json({ error: 'Missing contact parameter' }, { status: 400 });
  }
 const token = req.headers.get("authorization");

  const frappeUrl = `${CONSTANTS.API_BASE_URL}/api/resource/CRM Deal`;
  const filters = JSON.stringify([["contact", "=", contactName]]);
  const fields = JSON.stringify(["*"]);
  const url = `${frappeUrl}?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(fields)}&limit_page_length=0`;
 
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Frappe API error: ${res.status} ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    const deals = data.data || [];
    const totalCount = data.total || deals.length;
    return NextResponse.json({ data: data.data,totalCount });
  } catch (err: any) {
    console.error('Frappe fetch failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
