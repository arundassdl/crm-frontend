import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imagePath, itemCode } = body;
  const token = req.headers.get("Authorization");

  if (!imagePath || !itemCode) {
    return NextResponse.json({ error: "Missing imagePath or itemCode" }, { status: 400 });
  }

  const fileName = imagePath.split("/").pop();

  try {
    // 1. Delete the file
    const deleteFile = await fetch(`${ERP_API_BASE}/api/resource/File/${fileName}`, {
      method: "DELETE",
      headers: {
        Authorization: `${token}`,
      },
    });

    if (!deleteFile.ok) {
      const err = await deleteFile.json();
      return NextResponse.json({ error: "Failed to delete file", details: err }, { status: 500 });
    }

    // 2. Update the item to clear image field
    const updateItem = await fetch(`${ERP_API_BASE}/api/resource/Item/${itemCode}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ image: "" }),
    });

    if (!updateItem.ok) {
      const err = await updateItem.json();
      return NextResponse.json({ error: "Failed to update item", details: err }, { status: 500 });
    }

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Unexpected server error", details: error }, { status: 500 });
  }
}
