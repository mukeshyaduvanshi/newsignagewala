import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { invalidateUserRolesCache } from "@/modules/brands/user-roles/user-roles.controller";

export async function DELETE(req: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = req.headers.get("authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await req.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "User role ID is required" },
        { status: 400 },
      );
    }

    // Find the user role and verify ownership
    const existingAuthority = await UserRole.findById(id);

    if (!existingAuthority) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 404 },
      );
    }

    // Check if the user is the creator or parent
    if (
      existingAuthority.createdId.toString() !== decoded.userId &&
      existingAuthority.parentId.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { error: "You don't have permission to delete this authority" },
        { status: 403 },
      );
    }

    // Check if the authority is used in team
    if (existingAuthority.isUsedInTeam) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this authority as it is currently assigned to team members",
          isUsedInTeam: true,
        },
        { status: 400 },
      );
    }

    // If isUsedInTeam is false, set isActive to false (soft delete)
    const updatedAuthority = await UserRole.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    // 🔥 INVALIDATE CACHE - Force refetch on next request
    await invalidateUserRolesCache(decoded.userId).catch(() => {});

    return NextResponse.json(
      {
        message: "User role deleted successfully",
        authority: updatedAuthority,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting user role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user role" },
      { status: 500 },
    );
  }
}
