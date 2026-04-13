import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import BusinessDetails from "@/lib/models/BusinessDetails";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Build query for vendors
    let query: any = {
      userType: "vendor",
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Find all vendors
    const vendors = await User.find(query)
      .select("_id name email phone")
      .lean();

    // Fetch business details for all vendors
    const vendorIds = vendors.map((v: any) => v._id);
    const businessDetails = await BusinessDetails.find({ 
      parentId: { $in: vendorIds } 
    }).select("parentId companyName").lean();

    // Create a map for quick lookup
    const businessDetailsMap = new Map();
    businessDetails.forEach((bd: any) => {
      businessDetailsMap.set(bd.parentId.toString(), bd.companyName);
    });

    const formattedVendors = vendors.map((vendor: any) => ({
      _id: vendor._id.toString(),
      companyName: businessDetailsMap.get(vendor._id.toString()) || vendor.name || "N/A",
      email: vendor.email,
      phone: vendor.phone || "N/A",
      // pincode: "",
      // city: "",
      // state: "",
      // address: "",
    }));

    return NextResponse.json({ vendors: formattedVendors }, { status: 200 });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
