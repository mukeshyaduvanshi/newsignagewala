import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    await dbConnect();

    // Fetch all purchase authorities for this brand
    const authorities = await PurchaseAuthority.find({
      brandId: decoded.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Populate vendor information
    const authoritiesWithVendor = await Promise.all(
      authorities.map(async (authority) => {
        const vendor = await User.findById(authority.vendorId)
          .select("name email")
          .lean();

        return {
          ...authority,
          vendorName: vendor?.name || "Unknown",
          vendorEmail: vendor?.email || "",
        };
      }),
    );

    return NextResponse.json(
      { authorities: authoritiesWithVendor },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching purchase authorities:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase authorities" },
      { status: 500 },
    );
  }
}
