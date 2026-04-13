import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import BusinessDetails from "@/lib/models/BusinessDetails";
import BusinessKyc from "@/lib/models/BusinessKyc";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Extract and verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Fetch user details
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch business details
    const businessDetails = await BusinessDetails.findOne({ parentId: user._id });

    // Fetch business KYC
    const businessKyc = await BusinessKyc.findOne({ parentId: user._id });

    // Prepare response
    const profileData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isBusinessInformation: user.isBusinessInformation,
        isBusinessKyc: user.isBusinessKyc,
        adminApproval: user.adminApproval,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      businessDetails: businessDetails ? {
        companyName: businessDetails.companyName,
        companyType: businessDetails.companyType,
        companyLogo: businessDetails.companyLogo,
        companyProfile: businessDetails.companyProfile,
      } : null,
      businessKyc: businessKyc ? {
        hasGST: businessKyc.hasGST,
        gstNumber: businessKyc.gstNumber,
        aadharNumber: businessKyc.aadharNumber,
        cinNumber: businessKyc.cinNumber,
        msmeNumber: businessKyc.msmeNumber,
      } : null,
    };

    return NextResponse.json(
      {
        message: "Profile fetched successfully",
        data: profileData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
