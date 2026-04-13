import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Fetch team authorities for the brand
    const teamAuthorities = await UserRole.find({
      parentId: brandId,
      isActive: true,
    })
      .select("_id labelName uniqueKey description")
      .sort({ createdAt: 1 })
      .lean();

    // Transform data
    const transformedAuthorities = teamAuthorities.map((auth: any) => ({
      _id: auth._id.toString(),
      labelName: auth.labelName,
      uniqueKey: auth.uniqueKey,
      description: auth.description,
    }));

    return NextResponse.json(
      { data: transformedAuthorities },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles", details: error.message },
      { status: 500 }
    );
  }
}
