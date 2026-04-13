import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import BusinessKyc from '@/lib/models/BusinessKyc';
import DocumentModel from '@/lib/models/Document';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth/jwt';

// GET method - Fetch user's business KYC documents
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get userId from query params or use decoded token userId
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || decoded.userId;

    // Find business KYC for the user
    const businessKyc = await BusinessKyc.findOne({ parentId: userId });

    if (!businessKyc) {
      return NextResponse.json(
        { success: false, error: 'No business KYC found for this user' },
        { status: 404 }
      );
    }

    // Fetch verified documents from Documents collection
    const verifiedDocuments: any = {};

    if (businessKyc.gstNumber) {
      const gstDoc = await DocumentModel.findOne({
        documentType: 'gst',
        documentNumber: businessKyc.gstNumber.toUpperCase(),
      });
      if (gstDoc && gstDoc.verified) {
        verifiedDocuments.gst = {
          number: gstDoc.documentNumber,
          verified: gstDoc.verified,
          verifiedAt: gstDoc.verifiedAt,
          verifiedBy: gstDoc.verifiedBy,
          data: gstDoc.verificationData,
        };
      }
    }

    if (businessKyc.cinNumber) {
      const cinDoc = await DocumentModel.findOne({
        documentType: 'cin',
        documentNumber: businessKyc.cinNumber.toUpperCase(),
      });
      if (cinDoc && cinDoc.verified) {
        verifiedDocuments.cin = {
          number: cinDoc.documentNumber,
          verified: cinDoc.verified,
          verifiedAt: cinDoc.verifiedAt,
          verifiedBy: cinDoc.verifiedBy,
          data: cinDoc.verificationData,
        };
      }
    }

    if (businessKyc.msmeNumber) {
      const msmeDoc = await DocumentModel.findOne({
        documentType: 'msme',
        documentNumber: businessKyc.msmeNumber.toUpperCase(),
      });
      if (msmeDoc && msmeDoc.verified) {
        verifiedDocuments.msme = {
          number: msmeDoc.documentNumber,
          verified: msmeDoc.verified,
          verifiedAt: msmeDoc.verifiedAt,
          verifiedBy: msmeDoc.verifiedBy,
          data: msmeDoc.verificationData,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasGST: businessKyc.hasGST,
        gstNumber: businessKyc.gstNumber,
        aadharNumber: businessKyc.aadharNumber,
        cinNumber: businessKyc.cinNumber,
        msmeNumber: businessKyc.msmeNumber,
        verifiedDocuments,
        adminVerified: businessKyc.adminVerified || false,
        adminVerifiedAt: businessKyc.adminVerifiedAt,
      },
    });

  } catch (error) {
    console.error('Business KYC fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KYC information' },
      { status: 500 }
    );
  }
}

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

    // Get JSON data
    const body = await req.json();
    const { hasGST, gstNumber, aadharNumber, cinNumber, msmeNumber } = body;

    // Validate required fields based on GST status
    if (hasGST && !gstNumber) {
      return NextResponse.json(
        { success: false, message: 'GST number is required' },
        { status: 400 }
      );
    }

    if (!hasGST && !aadharNumber) {
      return NextResponse.json(
        { success: false, message: 'Aadhar number is required' },
        { status: 400 }
      );
    }

    // Save business KYC
    const businessKyc = await BusinessKyc.findOneAndUpdate(
      { parentId: userId },
      {
        parentId: userId,
        hasGST,
        gstNumber: hasGST ? gstNumber : null,
        aadharNumber: !hasGST ? aadharNumber : null,
        cinNumber: hasGST ? cinNumber : null,
        msmeNumber: hasGST ? msmeNumber : null,
      },
      { upsert: true, new: true }
    );

    // Update user's isBusinessKyc flag
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBusinessKyc: true },
      { new: true }
    );

    // Get redirect URL based on userType
    const redirectUrl = updatedUser?.userType === 'brand' ? '/brand' : '/vendor';

    return NextResponse.json({
      success: true,
      message: 'KYC completed successfully',
      data: businessKyc,
      redirectUrl,
    });

  } catch (error) {
    console.error('Business KYC save error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save KYC information' },
      { status: 500 }
    );
  }
}
