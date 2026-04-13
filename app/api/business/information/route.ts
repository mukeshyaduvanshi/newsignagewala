import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import BusinessDetails from '@/lib/models/BusinessDetails';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';
import { uploadToVercelBlob, formatBytes } from '@/lib/utils/uploadToBlob';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get form data
    const formData = await req.formData();
    const companyName = formData.get('companyName') as string;
    const companyType = formData.get('companyType') as string;
    const companyLogo = formData.get('companyLogo') as File | null;
    const companyProfile = formData.get('companyProfile') as File | null;

    if (!companyName || !companyType) {
      return NextResponse.json(
        { success: false, message: 'Company name and type are required' },
        { status: 400 }
      );
    }

    // Sanitize company name for folder path
    const folderName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Add timestamp to filename to avoid caching issues
    const timestamp = Date.now();

    // Get existing business details to delete old files if needed
    const existingBusiness = await BusinessDetails.findOne({ parentId: userId });

    // Upload files to Vercel Blob
    let logoUrl: string | null | undefined = undefined;
    let profileUrl: string | null | undefined = undefined;

    if (companyLogo) {
      // Delete old logo if it exists
      if (existingBusiness?.companyLogo) {
        try {
          const { del } = await import('@vercel/blob');
          await del(existingBusiness.companyLogo);
          console.log('Old logo deleted');
        } catch (error) {
          console.log('Error deleting old logo:', error);
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
      console.log(`Logo uploaded: ${formatBytes(logoResult.originalSize)} → ${formatBytes(logoResult.compressedSize)} (${logoResult.compressionRatio} reduction)`);
    }

    if (companyProfile) {
      // Delete old profile if it exists
      if (existingBusiness?.companyProfile) {
        try {
          const { del } = await import('@vercel/blob');
          await del(existingBusiness.companyProfile);
          console.log('Old profile deleted');
        } catch (error) {
          console.log('Error deleting old profile:', error);
        }
      }

      const profileResult = await uploadToVercelBlob({
        file: companyProfile,
        folder: folderName,
        filename: `companyProfile_${timestamp}`, // Add timestamp to avoid cache
      });
      profileUrl = profileResult.url;
      // console.log(`Profile uploaded: ${formatBytes(profileResult.originalSize)}`);
    }

    // Prepare update object - only update fields that are provided
    const updateData: any = {
      parentId: userId,
      companyName,
      companyType,
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

    // Update user's isBusinessInformation flag
    await User.findByIdAndUpdate(userId, {
      isBusinessInformation: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Business information saved successfully',
      data: businessDetails,
    });

  } catch (error) {
    console.error('Business information save error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save business information' },
      { status: 500 }
    );
  }
}
