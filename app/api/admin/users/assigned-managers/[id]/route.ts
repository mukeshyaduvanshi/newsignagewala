import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";

export async function PATCH(req: NextRequest) {
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

    // Get request body
    const body = await req.json();
    const { assignmentId, status } = body;

    // Validate required fields
    if (!assignmentId || !status) {
      return NextResponse.json(
        { error: "Assignment ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Find and update the team member
    const teamMember = await TeamMember.findOne({
      _id: assignmentId,
      createdBy: decoded.userId, // Only allow admin to update their own assignments
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Assignment not found or you don't have permission" },
        { status: 404 }
      );
    }

    teamMember.status = status;
    await teamMember.save();

    return NextResponse.json(
      {
        message: `Assignment ${status === "active" ? "activated" : "deactivated"} successfully`,
        data: {
          _id: teamMember._id.toString(),
          status: teamMember.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating assignment status:", error);
    return NextResponse.json(
      { error: "Failed to update assignment status", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    // Get assignment ID from query params
    const searchParams = req.nextUrl.searchParams;
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Find and delete the team member
    const teamMember = await TeamMember.findOneAndDelete({
      _id: assignmentId,
      createdBy: decoded.userId, // Only allow admin to delete their own assignments
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Assignment not found or you don't have permission" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Assignment deleted successfully",
        data: {
          _id: teamMember._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment", details: error.message },
      { status: 500 }
    );
  }
}
