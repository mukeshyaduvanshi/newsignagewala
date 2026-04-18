import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getTendersController } from "@/modules/vendor/tenders/tenders.controller";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    const { data: tenders } = await getTendersController(decoded.userId);

    return NextResponse.json({ tenders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tenders for vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenders" },
      { status: 500 },
    );
  }
}
