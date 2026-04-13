import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import connectDB from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";

export async function POST(req: NextRequest) {
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

    // Get storeId from request body
    const { storeId } = await req.json();

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    // Verify store exists and belongs to the same parent
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    if (store.parentId.toString() !== managerAuth.parentId.toString()) {
      return NextResponse.json(
        { error: "Store does not belong to your organization" },
        { status: 403 }
      );
    }

    // Verify store phone matches manager's phone
    if (store.storePhone !== teamMember.phone) {
      return NextResponse.json(
        { error: "Store phone does not match manager's phone" },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await StoreAssignManager.findOne({
      storeId: storeId,
      teamId: teamMember._id,
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Store is already assigned to this manager" },
        { status: 400 }
      );
    }

    // Create new assignment
    const newAssignment = await StoreAssignManager.create({
      storeId: storeId,
      teamId: teamMember._id,
      parentId: managerAuth.parentId, // From JWT token
      managerUserId: managerAuth.userId, // From JWT token
      isStoreUsed: false,
      raceeIds: [],
    });

    return NextResponse.json(
      {
        message: "Store activated and assigned successfully",
        data: newAssignment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error assigning store:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Store is already assigned to this manager" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
