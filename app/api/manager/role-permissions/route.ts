import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import { requireManagerAuth } from "@/lib/auth/manager-auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);

    // Fetch work authorities assigned to this manager using their uniqueKey
    const workAuthorities = await RolePermission.find({
      teamMemberUniqueKey: managerAuth.uniqueKey, // From JWT token
      parentId: managerAuth.parentId, // From JWT token
      isActive: true,
    }).sort({ createdAt: 1 }); // Ascending order (oldest first)

    return NextResponse.json(
      {
        message: "Role permissions fetched successfully",
        data: workAuthorities,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching manager role permissions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
