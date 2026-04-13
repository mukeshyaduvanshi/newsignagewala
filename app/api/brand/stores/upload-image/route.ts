import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { uploadToVercelBlob } from "@/lib/utils/uploadToBlob";

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `store-${timestamp}-${randomString}`;

    // Upload to Vercel Blob with compression using uploadToVercelBlob utility
    const uploadResult = await uploadToVercelBlob({
      file,
      folder: 'stores',
      filename: uniqueFileName,
      maxSizeKB: 300, // Compress to max 300KB for store images
      quality: 80,
    });

    return NextResponse.json(
      { 
        url: uploadResult.url,
        originalSize: uploadResult.originalSize,
        compressedSize: uploadResult.compressedSize,
        compressionRatio: uploadResult.compressionRatio,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image", details: error.message },
      { status: 500 }
    );
  }
}
