import { NextRequest, NextResponse } from 'next/server'
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  const { doctype, name } = await req.json()
  const token = req.headers.get("Authorization");

  if (!doctype || !name) {
    return NextResponse.json({ error: 'doctype and name required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${ERP_API_BASE}/api/resource/File?filters=[["attached_to_doctype","=","${doctype}"],["attached_to_name","=","${name}"]]&fields=["name","file_name","file_url","attached_to_field","is_private","file_size"]`, {
      headers: {
        Authorization: `${token}`,
      },
    })

    // The upstream may respond with an empty / non-JSON body on error; guard the parse
    // so this route always returns valid JSON instead of an empty body.
    const text = await res.text()
    const data = text ? JSON.parse(text) : { data: [] }
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch (error) {
    console.error("list-files route error:", error)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
