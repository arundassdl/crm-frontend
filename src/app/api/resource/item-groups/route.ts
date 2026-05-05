export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { FetchItemGroups } from "@/services/api/product-api/product-form-data";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("token ")) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid authorization token." },
        { status: 400 }
      );
    }

    const token = authHeader.replace("token ", "").trim();

    const result: any = await FetchItemGroups(token);

    const itemGroupArrys = [{ value: "", label: "" }];
    if (Array.isArray(result) && result.length > 0) {
      result.forEach((item: any) => {
        if (item?.name) {
          itemGroupArrys.push({ value: item.name, label: item.name });
        }
      });
    }

    return NextResponse.json(itemGroupArrys);
  } catch (error: any) {
    console.error("Item Group API Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
