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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const approvalStatus = searchParams.get("approvalStatus") || "active";
    const search = searchParams.get("search") || "";

    // Build filter query - only vendors
    const filter: any = {
      userType: "vendor",
    };

    // Filter by adminApproval status
    if (approvalStatus === "active") {
      filter.adminApproval = true;
    } else if (approvalStatus === "inactive") {
      filter.adminApproval = false;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch vendors with pagination
    const vendors = await User.find(filter)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Fetch business details for each vendor
    const vendorsWithBusinessDetails = await Promise.all(
      vendors.map(async (vendor: any) => {
        const businessDetails = await BusinessDetails.findOne({ userId: vendor._id })
          .select("-__v")
          .lean();

        return {
          id: vendor._id.toString(),
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          userType: vendor.userType,
          adminApproval: vendor.adminApproval,
          createdAt: vendor.createdAt,
          businessName: businessDetails?.companyName || "-",
          gstNumber: businessDetails?.gstNumber || "-",
          companyLogo: businessDetails?.companyLogo || "",
          businessDetails: businessDetails ? {
            companyName: businessDetails.companyName,
            companyLogo: businessDetails.companyLogo,
            gstNumber: businessDetails.gstNumber,
            cinNumber: businessDetails.cinNumber,
            msmeNumber: businessDetails.msmeNumber,
            billingAddress: businessDetails.billingAddress,
          } : null,
        };
      })
    );

    return NextResponse.json(
      {
        users: vendorsWithBusinessDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
