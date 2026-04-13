import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import BusinessKYC from "@/lib/models/BusinessKyc";

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

    // Verify token and get admin user
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const admin = await User.findById(decoded.userId);
    if (!admin || admin.userType !== 'admin') {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    const { userId, verifiedData } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user to approve
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's KYC data
    const kyc = await BusinessKYC.findOne({ parentId: userId });
    if (!kyc) {
      return NextResponse.json(
        { error: "KYC data not found" },
        { status: 404 }
      );
    }

    // Update KYC with admin approval metadata
    kyc.adminVerified = true;
    kyc.adminVerifiedAt = new Date();
    kyc.adminVerifiedBy = decoded.userId;
    await kyc.save();

    // Update user - set adminApproval to true
    user.adminApproval = true;
    await user.save();

    return NextResponse.json(
      { 
        message: "User approved successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          adminApproval: user.adminApproval,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
