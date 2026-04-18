import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getRatesController } from "@/modules/vendor/rates/rates.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Access denied - Vendor only" },
        { status: 403 },
      );
    }

    const { data } = await getRatesController(decoded.userId);

    return NextResponse.json(
      { message: "Vendor rates fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Fetch vendor rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendor rates" },
      { status: 500 },
    );
  }
}
