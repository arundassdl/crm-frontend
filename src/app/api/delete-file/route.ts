import { NextRequest, NextResponse } from 'next/server'
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;


export async function POST(req: NextRequest) {
  const { file } = await req.json()
  const token = req.headers.get("Authorization");
    console.log("fileDoc?.file_url",file?.file_url);
    
  if (!file?.file_url) {
    return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 })
  }
const response = await fetch(`${ERP_API_BASE}/api/resource/File/${file.name}`, {
            method: "DELETE",
            headers: {
              Authorization: `${token}`,
            },
          });

//   const response = await fetch(`${ERP_API_BASE}/api/method/frappe.core.doctype.file.file.delete_file`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//        Authorization: `${token}` || '', // if using login session
//     },
//     body: JSON.stringify({ file_url: fileUrl }),
//   })

  const data = await response.json()
  return NextResponse.json(data)
}
