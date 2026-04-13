import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
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
    const { brandId, userRoleId, managerId, uniqueKey, managerType } = body;

    // Validate required fields
    if (!brandId || !userRoleId || !managerId || !uniqueKey || !managerType) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Fetch manager details from User collection
    const manager = await User.findById(managerId)
      .select("_id name email phone userType")
      .lean();

    if (!manager || manager.userType !== "manager") {
      return NextResponse.json(
        { error: "Invalid manager" },
        { status: 400 }
      );
    }

    // Check if manager is already assigned to this brand with same uniqueKey
    const existingAssignment = await TeamMember.findOne({
      parentId: brandId,
      userId: managerId,
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This manager is already assigned to this brand" },
        { status: 409 }
      );
    }

    // Create new team member entry
    const newTeamMember = await TeamMember.create({
      parentId: brandId,
      uniqueKey: uniqueKey,
      userId: managerId,
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      managerType: managerType,
      canChangeType: true,
      createdBy: decoded.userId, // Admin who assigned this manager
      status: "active",
    });

    return NextResponse.json(
      {
        message: "Manager assigned successfully",
        data: {
          _id: newTeamMember._id.toString(),
          parentId: newTeamMember.parentId.toString(),
          uniqueKey: newTeamMember.uniqueKey,
          userId: newTeamMember.userId.toString(),
          name: newTeamMember.name,
          email: newTeamMember.email,
          phone: newTeamMember.phone,
          managerType: newTeamMember.managerType,
          status: newTeamMember.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error assigning manager:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This manager is already assigned to this brand" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to assign manager", details: error.message },
      { status: 500 }
    );
  }
}
