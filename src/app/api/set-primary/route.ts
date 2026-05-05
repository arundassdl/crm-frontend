import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function PUT(req: NextRequest) {
  const { doctype, docname, field, imagePath } = await req.json();
  const token = req.headers.get("Authorization");

  const res = await fetch(`${ERP_API_BASE}/api/resource/${doctype}/${docname}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
    body: JSON.stringify({ [field]: imagePath }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.message || 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Primary image set successfully', data });
}
