import { NextRequest, NextResponse } from 'next/server';
import { CONSTANTS } from "@/services/config/app-config";
const ERP_API_BASE = CONSTANTS.API_BASE_URL;
import FormData from "form-data";
import { uploadFileApi } from '@/services/api/product-api/create-edit-item';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const itemCode = formData.get("itemCode") as string;
  const oldImage = formData.get("oldImage") as string;
  const token = req.headers.get("Authorization");
  if (!file || !itemCode) {
    return NextResponse.json({ error: "Missing file or itemCode" }, { status: 400 });
  }
 
 
  if (oldImage) {
    // 1. Find the actual File name in ERPNext using the file_url
    // const fileQuery = await fetch(
    //   `${ERP_API_BASE}/api/resource/File?filters=[["file_url","=","${oldImage}"]]`,
    //   {
    //     headers: {
    //       Authorization: `${token}`,
    //     },
    //   }
    // );
    const fileQuery = await fetch(
      `${ERP_API_BASE}/api/resource/File?filters=[["attached_to_doctype","=","Item"],["attached_to_name","=","${itemCode}"]]`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    
  
    const fileData = await fileQuery.json();
    const fileDocs = fileData.data || [];
    
    console.log("fileData =>", fileData);
    
    for (const fileDoc of fileDocs) {
      if (fileDoc?.name) {
        try {
          const deleteRes = await fetch(`${ERP_API_BASE}/api/resource/File/${fileDoc.name}`, {
            method: "DELETE",
            headers: {
              Authorization: `${token}`,
            },
          });
    
          if (!deleteRes.ok) {
            console.warn(`Failed to delete file: ${fileDoc.name}`);
          }
        } catch (err) {
          console.error(`Error deleting file ${fileDoc.name}:`, err);
        }
      }
    }
    
  }
  const baseUrl = req.nextUrl.origin;

  const imageUrl = await uploadFileApi(file,itemCode,"Item",`${token}`,baseUrl)   
 

  if (!imageUrl) {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  return NextResponse.json({ message: "Image uploaded", image: imageUrl });
}
