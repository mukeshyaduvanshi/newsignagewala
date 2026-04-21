import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { getRolePermissionsController } from "@/modules/manager/role-permissions/role-permissions.controller";

export async function GET(req: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(req);

    const result = await getRolePermissionsController(
      managerAuth.userId,
      managerAuth.uniqueKey,
      managerAuth.parentId,
    );

    const data = (result as any).data ?? result;
    return NextResponse.json(
      { message: "Role permissions fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching manager role permissions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
