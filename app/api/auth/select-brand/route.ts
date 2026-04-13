import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import TeamMember from "@/lib/models/TeamMember";
import BusinessDetails from "@/lib/models/BusinessDetails";
import { verifyAccessToken } from "@/lib/auth/jwt";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json(
        { success: false, message: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Verify that the manager actually has access to this brand
    const teamMember = await TeamMember.findOne({
      userId: decoded.userId,
      parentId: brandId,
      status: "active"
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, message: "You don't have access to this brand" },
        { status: 403 }
      );
    }

    // Fetch the selected brand's details
    const brandUser = await User.findById(brandId);
    if (!brandUser) {
      return NextResponse.json(
        { success: false, message: "Brand not found" },
        { status: 404 }
      );
    }

    const brandDetails = await BusinessDetails.findOne({ parentId: brandId });

    // Fetch the manager user
    const managerUser = await User.findById(decoded.userId);
    if (!managerUser) {
      return NextResponse.json(
        { success: false, message: "Manager not found" },
        { status: 404 }
      );
    }

    // Generate new JWT access token with parentId and uniqueKey included
    const accessTokenPayload = {
      userId: managerUser._id.toString(),
      email: managerUser.email,
      userType: managerUser.userType,
      parentId: brandId.toString(),
      uniqueKey: teamMember.uniqueKey,
      teamMemberId: teamMember._id.toString(),
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: '1d',
      issuer: 'signagewala-app',
      audience: 'signagewala-users',
    });

    // Note: We keep the existing refresh token from login, no need to generate a new one

    // Return updated user data with selected brand information
    const responseData = {
      success: true,
      message: "Brand selected successfully",
      accessToken, // New token with parentId and uniqueKey
      selectedBrand: {
        brandId: brandUser._id,
        brandName: brandDetails?.companyName || brandUser.name,
        brandEmail: brandUser.email,
        companyLogo: brandDetails?.companyLogo || null,
        managerType: teamMember.managerType,
        teamMemberId: teamMember._id,
        teamMemberName: teamMember.name,
        teamMemberEmail: teamMember.email,
        teamMemberPhone: teamMember.phone,
        uniqueKey: teamMember.uniqueKey
      }
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("Brand selection error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
