import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";


const API_BASE_URL = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get('Authorization');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = `${API_BASE_URL}/api/method/frappe.desk.form.utils.add_comment`;

    const frappeRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await frappeRes.json();

    if (!frappeRes.ok) {
      return NextResponse.json({ error: data.message || 'Frappe error' }, { status: frappeRes.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Server error in post-comment route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
