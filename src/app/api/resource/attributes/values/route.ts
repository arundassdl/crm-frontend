export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { CONSTANTS } from "@/services/config/app-config";

// Simple in-memory cache object
let cache: any = {};

export async function POST(req: NextRequest) {
  try {
    const { attributeNames } = await req.json(); // e.g., ["Colour", "Size"]
    const token = req.headers.get("authorization");

    if (!Array.isArray(attributeNames) || !token) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const results = await Promise.all(
      attributeNames.map(async (name: string) => {
        const cacheKey = `attribute-${name}`;

        // Check if the result is already cached
        if (cache[cacheKey]) {
          return { name, values: cache[cacheKey] };
        }

        const url = `${CONSTANTS.API_BASE_URL}/api/resource/Item Attribute/${encodeURIComponent(name)}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (!res.ok) {
          console.error(`Failed to fetch attribute: ${name}`);
          return { name, values: [] };
        }

        const json = await res.json();
        const values = json.data?.item_attribute_values || [];

        // Cache the result
        cache[cacheKey] = values;

        // Optionally, set cache expiry (e.g., 5 minutes)
        setTimeout(() => {
          delete cache[cacheKey];
        }, 300000); // 5 minutes

        return {
          name,
          values,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in attribute values handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
