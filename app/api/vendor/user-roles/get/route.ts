import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { getUserRolesController } from "@/modules/vendor/user-roles/user-roles.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const { data } = await getUserRolesController(decoded.userId);

    return NextResponse.json(
      { message: "User roles fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Get user role error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user roles" },
      { status: 500 },
    );
  }
}
