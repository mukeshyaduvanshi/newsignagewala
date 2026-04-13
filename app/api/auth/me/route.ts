import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Access token required" },
        { status: 401 }
      );
    }

    // Verify access token
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // Find user by ID from token
    const user = await User.findById(tokenPayload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare user response (without sensitive data)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isBusinessInformation: user.isBusinessInformation,
      isBusinessKyc: user.isBusinessKyc,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}