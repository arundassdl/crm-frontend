export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createResource, createSaveDocs } from "@/services/api/common-erpnext-api/create-edit-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { module, formData, links } = body;
    const token = req.headers.get("authorization");
    console.log("tokentoken",token);
    
    if (!module || !formData || !token) {
        return NextResponse.json(
          { success: false, message: "Missing required fields." },
          { status: 400 }
        );
      }
    let result = await createSaveDocs(module, formData, token, links);
    if (result?.error) {
      const rawMessages = result.error._server_messages;
    
      let errorMessage = "Unknown error";
    
      try {
        const parsedMessages = JSON.parse(rawMessages); // first parse: JSON array
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          const messageObj = JSON.parse(parsedMessages[0]); // second parse: object inside array
          errorMessage = messageObj.message || errorMessage;
          if (errorMessage.includes("cannot be a leaf node as it has children")) {
            const match = errorMessage.match(/Item Group (.*?) cannot be a leaf node/);
            const itemGroupName = match?.[1] || "This Item Group";
            errorMessage = `Item Group '${itemGroupName}' is a parent item group and contains child entries.`;
          }          
        }
      } catch (e) {
        console.error("Failed to parse _server_messages:", e);
      }
    
      result = { error: errorMessage };
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

