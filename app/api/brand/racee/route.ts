import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import Racee from "@/lib/models/Racee";
import Store from "@/lib/models/Store";
import User from "@/lib/models/User";
import TeamMember from "@/lib/models/TeamMember";
import { getRaceeController } from "@/modules/brands/racee/racee.controller";

export const dynamic = "force-dynamic";

/**
 * GET /api/brand/racee
 * Get all racee requests for the brand
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Ensure models are registered (important for populate in dev mode)
    Store;
    User;
    TeamMember;

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyAccessToken(token);

    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized - Brand access only" },
        { status: 403 },
      );
    }

    const brandUserId = decoded.userId;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const { data, source } = await getRaceeController(brandUserId, {
      status,
      search,
    });

    return NextResponse.json({ success: true, data, source }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching racees:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
