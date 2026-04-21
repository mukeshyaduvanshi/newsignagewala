import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getRatesController } from "@/modules/brands/rates/rates.controller";

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
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 },
      );
    }

    const { data, source } = await getRatesController(decoded.userId);
    return NextResponse.json(
      { message: "Brand rates fetched successfully", data, source },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Fetch brand rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch brand rates" },
      { status: 500 },
    );
  }
}
