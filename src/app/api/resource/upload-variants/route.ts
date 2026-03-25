// app/api/upload-variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { CONSTANTS } from '@/services/config/app-config';

export async function POST(req: NextRequest) {
  try {
    // 1. Read incoming FormData
    const formData = await req.formData();
   
    // 1. Parse the variant data
    const variantsField = formData.get('variants');
    if (!variantsField || typeof variantsField !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "variants" field' },
        { status: 400 }
      );
    }

    const variants = JSON.parse(variantsField);

    // 2. Extract image files and encode in base64
    const images: Array<{
      itemCode: string;
      fileName: string;
      fileData: string;
    }> = [];
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (key.startsWith('variant_image_') && value instanceof Blob) {
        const itemCode = key.replace('variant_image_', '');
        const file = value as File;
        const fileName = file.name || `${itemCode}.jpg`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileData = buffer.toString('base64');

        images.push({ itemCode, fileName, fileData });
      }
    }

    // 3. Prepare payload for ERPNext
    const token = req.headers.get('Authorization') || '';
    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;

    const body = {
      version: CONSTANTS.VERSION,
      method: 'upload_variants_with_images',
      entity: 'product',
      variants,
      images,
    };

    const erpRes = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        Cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await erpRes.json();
    return NextResponse.json(data, { status: erpRes.status });
  } catch (err) {
    console.error('Error uploading variants:', err);
    return NextResponse.json(
      { error: 'Upload failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
