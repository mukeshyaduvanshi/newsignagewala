import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";

/**
 * GET /api/manager/switch-account/brands
 * Get all brands/vendors a manager works for
 */
export async function GET(req: NextRequest) {
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

    // Get all TeamMember records for this manager
    const teamMembers = await TeamMember.find({
      userId: decoded.userId,
      status: "active",
    })
      .populate({
        path: "parentId",
        select: "name email companyLogo userType businessDetails",
        model: "User",
      })
      .lean();

    // If only one brand, return empty array (no need to switch)
    if (teamMembers.length <= 1) {
      return NextResponse.json(
        {
          message: "Manager works for only one brand",
          data: [],
        },
        { status: 200 }
      );
    }

    // Transform data for frontend
    const brands = teamMembers.map((tm: any) => ({
      parentId: tm.parentId._id.toString(),
      parentName: tm.parentId.name,
      parentEmail: tm.parentId.email,
      parentLogo: tm.parentId.companyLogo,
      parentType: tm.parentId.userType,
      managerType: tm.managerType,
      uniqueKey: tm.uniqueKey,
      teamMemberId: tm._id.toString(),
    }));

    return NextResponse.json(
      {
        message: "Brands fetched successfully",
        data: brands,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching manager brands:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
