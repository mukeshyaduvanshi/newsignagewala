import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import connectDB from "@/lib/db/mongodb";
import { getRatesController } from "@/modules/admin/rates/rates.controller";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

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

    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { error: "Access denied - Admin only" },
        { status: 403 },
      );
    }

    const result = await getRatesController(userId);
    const data = (result as any).data ?? result;

    return NextResponse.json(
      { message: "Master rates fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Get master rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch master rates" },
      { status: 500 },
    );
  }
}
