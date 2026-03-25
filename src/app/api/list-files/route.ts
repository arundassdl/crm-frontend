import { NextRequest, NextResponse } from 'next/server'
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  const { doctype, name } = await req.json()
  const token = req.headers.get("Authorization");

  if (!doctype || !name) {
    return NextResponse.json({ error: 'doctype and name required' }, { status: 400 })
  }

  const res = await fetch(
//     `${ERP_API_BASE}/api/resource/File?filters=${encodeURIComponent(JSON.stringify([
//     ['attached_to_doctype', '=', doctype],
//     ['attached_to_name', '=', name],
//   ]))}
  `${ERP_API_BASE}/api/resource/File?filters=[["attached_to_doctype","=","${doctype}"],["attached_to_name","=","${name}"]]
  &fields=["name","file_name","file_url","attached_to_field","is_private","file_size"]`, {
    headers: {
    //   'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data)
}
