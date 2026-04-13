import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import TeamMember from "@/lib/models/TeamMember";
import connectDB from "@/lib/db/mongodb";

// GET - Fetch unique manager types for the brand
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const brand = await User.findById(userId);
    if (!brand || brand.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    // Get distinct manager types (uniqueKey) for this brand
    const managerTypes = await TeamMember.distinct("uniqueKey", {
      parentId: userId,
      status: "active",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          managerTypes: managerTypes.sort(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching manager types:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
