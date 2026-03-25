export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { CONSTANTS } from "@/services/config/app-config";

// Simple in-memory cache object
let cache: any = {};

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization');

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  // Check if the data is cached
  const cacheKey = 'item-attributes';
  if (cache[cacheKey]) {
    return NextResponse.json(cache[cacheKey]);
  }

  // If not cached, fetch from the API
  const res = await fetch(`${CONSTANTS.API_BASE_URL}/api/method/frappe.client.get_list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
    body: JSON.stringify({
      doctype: 'Item Attribute',
      fields: ['name'],
      limit_page_length: 100,
    }),
  });

  const data = await res.json();

  // Cache the result for 5 minutes (300 seconds)
  cache[cacheKey] = data.message;

  // Optionally, set a timeout to clear cache after 5 minutes
  setTimeout(() => {
    delete cache[cacheKey];
  }, 300000); // 5 minutes

  return NextResponse.json(data.message);
}
