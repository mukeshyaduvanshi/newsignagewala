import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import mongoose from "mongoose";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    // Extract and verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    // Verify user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      id,
      teamMemberId,
      teamMemberName,
      teamMemberUniqueKey,
      permissions,
    } = body;

    // Validation
    if (
      !id ||
      !teamMemberId ||
      !teamMemberName ||
      !teamMemberUniqueKey ||
      !permissions ||
      !Array.isArray(permissions)
    ) {
      return NextResponse.json(
        { error: "ID, team member, unique key, and permissions are required" },
        { status: 400 },
      );
    }

    // Find the role permission
    const rolePermission = await RolePermission.findById(id);

    if (!rolePermission) {
      return NextResponse.json(
        { error: "Role permission not found" },
        { status: 404 },
      );
    }

    // Admin can update their own work authorities
    const userId = new mongoose.Types.ObjectId(decoded.userId);
    if (rolePermission.createdId.toString() !== userId.toString()) {
      return NextResponse.json(
        {
          error: "Unauthorized - You can only update your own role permissions",
        },
        { status: 403 },
      );
    }

    // Check if changing team member and if another role permission exists for the new team member
    if (rolePermission.teamMemberId.toString() !== teamMemberId) {
      const existingRolePermission = await RolePermission.findOne({
        teamMemberId,
        createdId: userId,
        isActive: true,
        _id: { $ne: id },
      });

      if (existingRolePermission) {
        return NextResponse.json(
          { error: "Role permission already exists for this team member" },
          { status: 400 },
        );
      }
    }

    // Update role permission
    rolePermission.teamMemberId = teamMemberId;
    rolePermission.teamMemberName = teamMemberName;
    rolePermission.teamMemberUniqueKey = teamMemberUniqueKey;
    rolePermission.permissions = permissions;
    await rolePermission.save();

    // Propagate updated permissions to all brand-scoped copies (from previous assignments)
    await RolePermission.updateMany(
      {
        teamMemberUniqueKey,
        createdId: userId,
        _id: { $ne: rolePermission._id }, // exclude the admin template itself
        isActive: true,
      },
      {
        $set: {
          teamMemberName,
          permissions,
        },
      },
    );

    return NextResponse.json(
      {
        message: "Role permission updated successfully",
        data: rolePermission,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating role permission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
