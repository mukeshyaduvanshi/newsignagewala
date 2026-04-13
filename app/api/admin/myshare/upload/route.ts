import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/myshare";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const expiryDays = parseInt(formData.get("expiryDays") as string || "7");
    const recipientEmail = (formData.get("recipientEmail") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    // if (!allowedTypes.includes(file.type)) {
    //   return NextResponse.json(
    //     { success: false, error: "Only image files are allowed (JPEG, PNG, GIF, WEBP, SVG)" },
    //     { status: 400 }
    //   );
    // }

    // const maxSize = 10 * 1024 * 1024; // 10MB
    // if (file.size > maxSize) {
    //   return NextResponse.json(
    //     { success: false, error: "File size must be less than 10MB" },
    //     { status: 400 }
    //   );
    // }

    const result = await uploadFile(file, { expiryDays, recipientEmail });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
