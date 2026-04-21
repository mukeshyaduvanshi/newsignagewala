import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { apiCache } from "@/lib/cache/with-cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    await connectDB();

    // Cache per-user for 60s — roles change infrequently
    const formattedAuthorities = await apiCache(
      `brand:authorities:v1:${decoded.userId}`,
      60,
      async () => {
        const teamAuthorities = await UserRole.find({
          parentId: decoded.userId,
          isActive: true,
        })
          .select("labelName uniqueKey description")
          .sort({ labelName: 1 })
          .lean();

        return teamAuthorities.map((authority: any) => ({
          _id: authority._id.toString(),
          labelName: authority.labelName,
          uniqueKey: authority.uniqueKey,
          description: authority.description,
        }));
      },
    );

    return NextResponse.json(
      {
        success: true,
        data: formattedAuthorities,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching team authorities:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
