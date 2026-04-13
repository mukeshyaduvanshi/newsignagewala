import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);
    
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

    // Admin gets only their own created team authorities
    const teamAuthorities = await UserRole.find({
      createdId: userId,
      isActive: true
    })
    .sort({ createdAt: -1 }) // Latest first
    .lean();

    return NextResponse.json(
      {
        message: "User roles fetched successfully",
        data: teamAuthorities,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get user roles error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}
