import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const { origin } = new URL(req.url);
    const formData = await req.formData();

    const file = formData.get('file') as Blob | null;
    const itemCode = formData.get('item_code') as string;
    const doctype = formData.get('module') as string;

    if (!file || !itemCode) {
      return NextResponse.json({ error: 'Missing file or item_code' }, { status: 400 });
    }
    const token = req.headers.get("Authorization");

    // Upload file to ERPNext
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('is_private', '0');
    // uploadForm.append('doctype', doctype);
    // uploadForm.append('docname', itemCode);
    uploadForm.append("attached_to_doctype", doctype);
    uploadForm.append("attached_to_name", itemCode);

    const uploadRes = await fetch(`${ERP_API_BASE}/api/method/upload_file`, {
      method: 'POST',
      headers: {
        Authorization: `${token}`,
      },
      body: uploadForm,
    });

    const uploadData = await uploadRes.json();
    console.log('Upload Data:', uploadData);

    if (!uploadData.message?.file_url) {
      return NextResponse.json(
        { error: uploadData.exc || 'File upload failed' },
        { status: 500 }
      );
    }

    const fileUrl = uploadData.message.file_url;

    // Update item with image path
    const updateItem = await fetch(`${ERP_API_BASE}/api/resource/${doctype}/${itemCode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify({ image: fileUrl }),
    });

    const updateData = await updateItem.json();
    console.log('Updated Item Data:', updateData);

    return NextResponse.json({
      message: 'Image uploaded and item updated successfully',
      file_url: fileUrl,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
