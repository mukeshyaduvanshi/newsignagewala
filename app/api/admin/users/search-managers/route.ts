import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import User from "@/lib/models/User";

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

    // Build filter query for managers only
    const filter: any = {
      userType: "manager",
      adminApproval: true, // Only show approved managers
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };

    // Fetch managers (limit to 10 results)
    const managers = await User.find(filter)
      .select("_id name email phone")
      .limit(10)
      .lean();

    // Transform managers data
    const transformedManagers = managers.map((manager: any) => ({
      _id: manager._id.toString(),
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
    }));

    return NextResponse.json(
      { data: transformedManagers },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error searching managers:", error);
    return NextResponse.json(
      { error: "Failed to search managers", details: error.message },
      { status: 500 }
    );
  }
}
