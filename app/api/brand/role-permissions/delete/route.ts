import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import { verifyAccessToken } from "@/lib/auth/jwt";
import mongoose from "mongoose";
import { invalidateRolePermissionsCache } from "@/modules/brands/role-permissions/role-permissions.controller";
import { invalidateManagerSidebarCacheByParent } from "@/modules/manager/cache-invalidation";

export async function DELETE(req: NextRequest) {
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

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Role permission ID is required" },
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

    // Check ownership
    const userId = new mongoose.Types.ObjectId(decoded.userId);
    if (
      rolePermission.createdId.toString() !== userId.toString() &&
      rolePermission.parentId.toString() !== userId.toString()
    ) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this role permission" },
        { status: 403 },
      );
    }

    // Check if it's being used
    if (rolePermission.isUsedInWork) {
      return NextResponse.json(
        {
          error:
            "This role permission is currently in use and cannot be deleted",
          isUsedInWork: true,
        },
        { status: 400 },
      );
    }

    // Soft delete (set isActive to false)
    rolePermission.isActive = false;
    await rolePermission.save();

    await invalidateRolePermissionsCache(decoded.userId).catch(() => {});
    await invalidateManagerSidebarCacheByParent(decoded.userId).catch(() => {});
    return NextResponse.json(
      {
        message: "Role permission deleted successfully",
        data: rolePermission,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting role permission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
