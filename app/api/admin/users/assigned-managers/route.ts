import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import BusinessDetails from "@/lib/models/BusinessDetails";

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

    // Fetch all team members assigned by this admin
    const teamMembers = await TeamMember.find({
      createdBy: decoded.userId,
      status: { $ne: "deleted" },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (teamMembers.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Get unique parent IDs (brands)
    const parentIds = [...new Set(teamMembers.map((tm: any) => tm.parentId.toString()))];

    // Fetch brand details
    const brands = await User.find({
      _id: { $in: parentIds },
      userType: "brand",
    })
      .select("_id name email phone")
      .lean();

    // Fetch business details for brands
    const businessDetails = await BusinessDetails.find({
      parentId: { $in: parentIds },
    })
      .select("parentId companyName companyLogo")
      .lean();

    // Create maps for quick lookup
    const brandMap = new Map(brands.map((b: any) => [b._id.toString(), b]));
    const businessMap = new Map(
      businessDetails.map((bd: any) => [bd.parentId.toString(), bd])
    );

    // Transform data
    const transformedData = teamMembers.map((tm: any) => {
      const brand = brandMap.get(tm.parentId.toString());
      const business = businessMap.get(tm.parentId.toString());

      return {
        _id: tm._id.toString(),
        manager: {
          _id: tm.userId.toString(),
          name: tm.name,
          email: tm.email,
          phone: tm.phone,
        },
        brand: {
          _id: tm.parentId.toString(),
          name: brand?.name || "Unknown",
          email: brand?.email || "",
          phone: brand?.phone || "",
          companyName: business?.companyName || "",
          companyLogo: business?.companyLogo || "",
        },
        managerType: tm.managerType,
        uniqueKey: tm.uniqueKey,
        status: tm.status,
        createdAt: tm.createdAt,
      };
    });

    return NextResponse.json(
      { data: transformedData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching assigned managers:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned managers", details: error.message },
      { status: 500 }
    );
  }
}
