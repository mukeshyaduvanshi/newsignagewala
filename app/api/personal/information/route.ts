import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import BusinessDetails from "@/lib/models/BusinessDetails";
import BusinessKyc from "@/lib/models/BusinessKyc";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { uploadToVercelBlob, formatBytes } from "@/lib/utils/uploadToBlob";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get access token from Authorization header
    const authHeader = req.headers.get("authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get form data
    const formData = await req.formData();
    const companyLogo = formData.get("companyLogo") as File | null;
    const companyProfile = formData.get("companyProfile") as File | null;
    const aadharNumber = formData.get("aadharNumber") as string | null;
    const companyName = formData.get("userName") as string;

    // Sanitize company name for folder path
    const folderName = companyName.replace(/[^a-zA-Z0-9-_]/g, "_");

    // Add timestamp to filename to avoid caching issues
    const timestamp = Date.now();

    // Get existing business details to delete old files if needed
    const existingBusiness = await BusinessDetails.findOne({
      parentId: userId,
    });

    // Upload files to Vercel Blob
    let logoUrl: string | null | undefined = undefined;
    let profileUrl: string | null | undefined = undefined;

    if (companyLogo) {
      // Delete old logo if it exists
      if (existingBusiness?.companyLogo) {
        try {
          const { del } = await import("@vercel/blob");
          await del(existingBusiness.companyLogo);
          console.log("Old Profile Photo deleted");
        } catch (error) {
          console.log("Error deleting Profile Photo:", error);
        }
      }

      const logoResult = await uploadToVercelBlob({
        file: companyLogo,
        folder: folderName,
        filename: `logo_${timestamp}`, // Add timestamp to avoid cache
        maxSizeKB: 300, // 300KB max for logo
        quality: 85,
      });
      logoUrl = logoResult.url;
      console.log(
        `Logo uploaded: ${formatBytes(logoResult.originalSize)} → ${formatBytes(
          logoResult.compressedSize
        )} (${logoResult.compressionRatio} reduction)`
      );
    }

    if (companyProfile) {
      // Delete old profile if it exists
      if (existingBusiness?.companyProfile) {
        try {
          const { del } = await import("@vercel/blob");
          await del(existingBusiness.companyProfile);
          console.log("Old profile deleted");
        } catch (error) {
          console.log("Error deleting old profile:", error);
        }
      }

      const profileResult = await uploadToVercelBlob({
        file: companyProfile,
        folder: folderName,
        filename: `userProfile_${timestamp}`, // Add timestamp to avoid cache
      });
      profileUrl = profileResult.url;
      // console.log(`Profile uploaded: ${formatBytes(profileResult.originalSize)}`);
    }

    // Prepare update object - only update fields that are provided
    const updateData: any = {
      parentId: userId,
      // companyName,
    };

    // Only update logo if a new one was uploaded
    if (logoUrl !== undefined) {
      updateData.companyLogo = logoUrl;
    }

    // Only update profile if a new one was uploaded
    if (profileUrl !== undefined) {
      updateData.companyProfile = profileUrl;
    }

    // Save business details
    const businessDetails = await BusinessDetails.findOneAndUpdate(
      { parentId: userId },
      updateData,
      { upsert: true, new: true }
    );

    // Save business KYC
    const businessKyc = await BusinessKyc.findOneAndUpdate(
      { parentId: userId },
      {
        aadharNumber: aadharNumber,
      },
      { upsert: true, new: true }
    );

    // Update user's isBusinessInformation flag
    await User.findByIdAndUpdate(userId, {
      isBusinessInformation:
        logoUrl ||
        profileUrl ||
        existingBusiness?.companyLogo ||
        existingBusiness?.companyProfile
          ? true
          : false,
      isBusinessKyc:
        aadharNumber || existingBusiness?.aadharNumber ? true : false,
    });

    return NextResponse.json({
      success: true,
      message: "Personal information saved successfully",
      data: { businessDetails, businessKyc },
    });
  } catch (error) {
    console.error("Personal information save error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save personal information" },
      { status: 500 }
    );
  }
}
