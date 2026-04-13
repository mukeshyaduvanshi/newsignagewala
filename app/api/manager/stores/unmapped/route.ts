import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import connectDB from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);

    // Get the team member record for this manager
    const teamMember = await TeamMember.findOne({
      userId: managerAuth.userId,
      parentId: managerAuth.parentId,
      status: "active",
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    console.log({ parentId: managerAuth.parentId, phone: teamMember.phone });


    // Find stores where storePhone matches manager's phone
    const matchingStores = await Store.find({
      parentId: managerAuth.parentId, // From JWT token
      storePhone: teamMember.phone,
      isActive: true,
    });

    if (matchingStores.length === 0) {
      return NextResponse.json(
        {
          message: "No unmapped stores found",
          data: [],
        },
        { status: 200 }
      );
    }

    // Get store IDs that are already assigned
    const assignedStores = await StoreAssignManager.find({
      storeId: { $in: matchingStores.map((s) => s._id) },
      teamId: teamMember._id,
    }).select("storeId");

    const assignedStoreIds = assignedStores.map((a) => a.storeId.toString());

    // Filter out already assigned stores
    const unmappedStores = matchingStores.filter(
      (store) => !assignedStoreIds.includes(store._id.toString())
    );

    return NextResponse.json(
      {
        message: "Unmapped stores fetched successfully",
        data: unmappedStores,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching unmapped stores:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
