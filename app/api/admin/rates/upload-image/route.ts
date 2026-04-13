import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import { uploadToVercelBlob } from "@/lib/utils/uploadToBlob";
import sharp from "sharp";
import { put } from "@vercel/blob";

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

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is admin
    const user = await User.findById(userId);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    // Get the uploaded file from form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalSize = file.size;

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const actualWidth = metadata.width || 0;
    const actualHeight = metadata.height || 0;

    // console.log(`📸 Original Image - Width: ${actualWidth}px, Height: ${actualHeight}px, Size: ${(originalSize / 1024).toFixed(2)}KB`);

    let processedBuffer: Buffer;
    let newWidth = actualWidth;
    let newHeight = actualHeight;

    // Resize if width is greater than 800px
    if (actualWidth > 800) {
      newWidth = 800;
      newHeight = Math.round((actualHeight / actualWidth) * 800);
      
      // console.log(`🔄 Resizing to - Width: ${newWidth}px, Height: ${newHeight}px`);

      processedBuffer = await sharp(buffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    } else {
      // Just compress without resizing
      processedBuffer = await sharp(buffer)
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    }

    const finalSize = processedBuffer.length;
    const compressionRatio = ((1 - finalSize / originalSize) * 100).toFixed(2);

    // console.log(`✅ Final Image - Size: ${(finalSize / 1024).toFixed(2)}KB, Compression: ${compressionRatio}%`);

    // Generate blob path
    const blobPath = `masterrates/rate-${userId}-${Date.now()}.jpg`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, processedBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
    });

    return NextResponse.json(
      {
        message: "Image uploaded successfully",
        imageUrl: blob.url,
        originalSize: originalSize,
        originalDimensions: { width: actualWidth, height: actualHeight },
        finalSize: finalSize,
        finalDimensions: { width: newWidth, height: newHeight },
        compressionRatio: `${compressionRatio}%`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
