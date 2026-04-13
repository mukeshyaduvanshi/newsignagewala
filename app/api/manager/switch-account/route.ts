import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import BusinessDetails from "@/lib/models/BusinessDetails";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

/**
 * POST /api/manager/switch-account
 * Switch manager account to a different brand/vendor
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

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
    if (!decoded || decoded.userType !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized - Manager access only" },
        { status: 401 }
      );
    }

    // Get parentId from request body
    const { parentId } = await req.json();

    if (!parentId) {
      return NextResponse.json(
        { error: "Parent ID is required" },
        { status: 400 }
      );
    }

    // Verify this manager works for this brand
    const teamMember = await TeamMember.findOne({
      userId: decoded.userId,
      parentId: parentId,
      status: "active",
    }).lean();

    if (!teamMember) {
      return NextResponse.json(
        { error: "You are not authorized to access this brand" },
        { status: 403 }
      );
    }

    // Get user details
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get parent details
    const parent = await User.findById(parentId).lean();
    if (!parent) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Get business details for company logo
    const businessDetails = await BusinessDetails.findOne({ parentId: parentId }).lean();

    // Generate new access token with updated parentId and uniqueKey
    const accessTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType,
      adminApproval: user.adminApproval,
      parentId: parentId,
      uniqueKey: teamMember.uniqueKey,
      teamMemberName: teamMember.name,
      teamMemberEmail: teamMember.email,
      teamMemberPhone: teamMember.phone,
      managerType: teamMember.managerType,
      companyLogo: businessDetails?.companyLogo || null,
    };

    const newAccessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: "1d",
      issuer: "signagewala",
      audience: "signagewala-users",
    });

    return NextResponse.json(
      {
        message: "Account switched successfully",
        accessToken: newAccessToken,
        user: {
          userId: user._id.toString(),
          email: user.email,
          userType: user.userType,
          adminApproval: user.adminApproval,
          parentId: parentId,
          uniqueKey: teamMember.uniqueKey,
          teamMemberName: teamMember.name,
          teamMemberEmail: teamMember.email,
          teamMemberPhone: teamMember.phone,
          managerType: teamMember.managerType,
          companyLogo: businessDetails?.companyLogo || null,
          name: parent.name,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error switching account:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
