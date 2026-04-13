import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Extract and verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { teamMemberId, teamMemberName, teamMemberUniqueKey, permissions } = body;

    // Validation
    if (!teamMemberId || !teamMemberName || !teamMemberUniqueKey || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Team member, unique key, and permissions are required" },
        { status: 400 }
      );
    }

    // Check if role permission already exists for this team member
    const existingRolePermission = await RolePermission.findOne({
      teamMemberId,
      createdId: new mongoose.Types.ObjectId(decoded.userId),
      isActive: true,
    });

    if (existingRolePermission) {
      return NextResponse.json(
        { error: "Role permission already exists for this team member" },
        { status: 400 }
      );
    }

    // Create new role permission
    const rolePermission = await RolePermission.create({
      teamMemberId,
      teamMemberName,
      teamMemberUniqueKey,
      permissions,
      createdId: new mongoose.Types.ObjectId(decoded.userId),
      parentId: new mongoose.Types.ObjectId(decoded.userId),
      isActive: true,
      isUsedInWork: false,
    });

    return NextResponse.json(
      {
        message: "Role permission created successfully",
        data: rolePermission,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating role permission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
