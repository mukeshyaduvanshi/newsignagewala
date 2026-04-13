import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    if (!search || search.length < 2) {
      return NextResponse.json(
        { data: [] },
        { status: 200 }
      );
    }

    // Build filter query for brands only
    const filter: any = {
      userType: "brand",
      adminApproval: true, // Only show approved brands
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };

    // Fetch brands (limit to 10 results)
    const brands = await User.find(filter)
      .select("_id name email phone")
      .limit(10)
      .lean();

    // Get business details for these brands
    const brandIds = brands.map((brand: any) => brand._id);
    const businessDetails = await BusinessDetails.find({
      parentId: { $in: brandIds },
    })
      .select("parentId companyName companyLogo")
      .lean();

    // Create a map for quick lookup
    const businessDetailsMap = new Map(
      businessDetails.map((bd: any) => [bd.parentId.toString(), bd])
    );

    // Transform brands data
    const transformedBrands = brands.map((brand: any) => {
      const businessDetail = businessDetailsMap.get(brand._id.toString());
      return {
        _id: brand._id.toString(),
        name: brand.name,
        email: brand.email,
        phone: brand.phone,
        companyName: businessDetail?.companyName || "",
        companyLogo: businessDetail?.companyLogo || "",
      };
    });

    return NextResponse.json(
      { data: transformedBrands },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error searching brands:", error);
    return NextResponse.json(
      { error: "Failed to search brands", details: error.message },
      { status: 500 }
    );
  }
}
