import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import User from "@/lib/models/User";
import { requireManagerAuth } from "@/lib/auth/manager-auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get manager auth data from JWT token (includes parentId)
    const managerAuth = await requireManagerAuth(req);

    // Get search query
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Find stores assigned to this manager via StoreAssignManager
    // Filter by parentId to ensure manager only sees their brand's stores
    const assignments = await StoreAssignManager.find({
      managerUserId: managerAuth.userId,
      parentId: managerAuth.parentId, // From JWT token
    }).select('storeId');

    // Extract store IDs
    const assignedStoreIds = assignments.map(a => a.storeId);

    if (assignedStoreIds.length === 0) {
      return NextResponse.json(
        {
          message: "No stores assigned",
          data: [],
        },
        { status: 200 }
      );
    }

    // Build query - fetch only assigned stores
    const query: any = {
      _id: { $in: assignedStoreIds },
      isActive: true,
    };

    // Add search if provided
    if (search && search.trim()) {
      query.$and = [
        { _id: { $in: assignedStoreIds } },
        {
          $or: [
            { storeName: { $regex: search, $options: "i" } },
            { storePhone: { $regex: search, $options: "i" } },
            { storeAddress: { $regex: search, $options: "i" } },
            { storeCity: { $regex: search, $options: "i" } },
            { storeState: { $regex: search, $options: "i" } },
            { storePincode: { $regex: search, $options: "i" } },
          ],
        },
      ];
      delete query.$or;
    }

    const stores = await Store.find(query).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Stores fetched successfully",
        data: stores,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching manager stores:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
