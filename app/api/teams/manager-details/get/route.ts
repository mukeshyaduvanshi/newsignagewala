import { verifyAccessToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import BusinessDetails from "@/lib/models/BusinessDetails";
import Store from "@/lib/models/Store";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get managerId from query parameters
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json(
        { error: "Manager ID is required" },
        { status: 400 },
      );
    }

    // GET token from Authorization header
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    //veirfy token and get user ID
    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const userId = decoded.userId;
    // Verify user is brand
    const user = await User.findById(userId);
    if (!user || user.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 },
      );
    }

    // Fetch manager details
    const teamsMember = await TeamMember.findById(new ObjectId(managerId));
    if (!teamsMember) {
      return NextResponse.json(
        { error: "Manager not found" },
        { status: 404 },
      );
    }

    // Fetch business details
    const businessDetails = await BusinessDetails.findOne({ parentId: new ObjectId(teamsMember?.userId) });
    // if (!businessDetails) {
    //   return NextResponse.json(
    //     { error: "This Manager Details not found" },
    //     { status: 404 },
    //   );
    // }

    // Fetch store Counts
    const storeDetailsCount = await StoreAssignManager.countDocuments({ teamId: new ObjectId(teamsMember._id) });

    // Fetch assigned stores
    const storeAssignManagers = await StoreAssignManager.find({ teamId: new ObjectId(teamsMember._id) });
    const storeIds = storeAssignManagers.map((sam) => sam.storeId);

    const stores = await Store.find({ _id: { $in: storeIds } });
  // console.log({stores});

    const managerDetails = {
        companyLogo: businessDetails?.companyLogo ? businessDetails.companyLogo : null,
        storeCount: storeDetailsCount || 0,
        stores: stores || [],
    }
    
    

    return NextResponse.json(
        {
            message: "Manager details fetched successfully",
            manager: managerDetails,
        },
        { status: 200 },
    )
    
    
    

  } catch (error) {
    console.error("Error fetching manager details:", error);
    return NextResponse.json(
      { error: "Failed to fetch manager details" },
      { status: 500 },
    );
  }
}
