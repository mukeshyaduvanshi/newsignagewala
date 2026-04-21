import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import { getRolePermissionsController } from "@/modules/admin/role-permissions/role-permissions.controller";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

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

    const user = await User.findById(decoded.userId);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 },
      );
    }

    const result = await getRolePermissionsController(decoded.userId);
    const data = (result as any).data ?? result;

    return NextResponse.json(
      { message: "Role permissions fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
