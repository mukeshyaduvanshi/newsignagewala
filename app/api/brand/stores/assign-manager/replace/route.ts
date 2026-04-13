import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth/jwt";

// PUT - Replace manager in assignment
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const brand = await User.findById(userId);
    if (!brand || brand.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignmentId, newTeamId, newManagerUserId } = body;

    if (!assignmentId || !newTeamId || !newManagerUserId) {
      return NextResponse.json(
        { error: "Missing required fields: assignmentId, newTeamId, newManagerUserId" },
        { status: 400 }
      );
    }

    // Find the existing assignment
    const existingAssignment = await StoreAssignManager.findById(assignmentId);
    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify it belongs to this brand
    if (existingAssignment.parentId.toString() !== userId) {
      return NextResponse.json(
        { error: "Access denied - Not your assignment" },
        { status: 403 }
      );
    }

    // Get the new team member to verify uniqueKey matches
    const newTeamMember = await TeamMember.findById(newTeamId);
    if (!newTeamMember) {
      return NextResponse.json(
        { error: "New team member not found" },
        { status: 404 }
      );
    }

    // Get the old team member to check uniqueKey
    const oldTeamMember = await TeamMember.findById(existingAssignment.teamId);
    if (!oldTeamMember) {
      return NextResponse.json(
        { error: "Current team member not found" },
        { status: 404 }
      );
    }

    // Verify both team members have the same uniqueKey
    if (oldTeamMember.uniqueKey !== newTeamMember.uniqueKey) {
      return NextResponse.json(
        {
          error: `Cannot replace: uniqueKey mismatch. Current manager has role "${oldTeamMember.uniqueKey}" but new manager has role "${newTeamMember.uniqueKey}"`,
        },
        { status: 400 }
      );
    }

    // Check if there's already another assignment with the new teamId for this store
    const duplicateCheck = await StoreAssignManager.findOne({
      storeId: existingAssignment.storeId,
      teamId: newTeamId,
      parentId: userId,
      _id: { $ne: assignmentId }, // Exclude current assignment
    });

    if (duplicateCheck) {
      return NextResponse.json(
        { error: "This manager is already assigned to this store" },
        { status: 400 }
      );
    }

    // Update the assignment
    existingAssignment.teamId = newTeamId;
    existingAssignment.managerUserId = newManagerUserId;
    await existingAssignment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Manager replaced successfully",
        data: existingAssignment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error replacing manager:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
