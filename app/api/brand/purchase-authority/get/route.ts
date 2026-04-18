import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getPurchaseAuthorityController } from "@/modules/brands/purchase-authority/purchase-authority.controller";

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
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    const { data: authorities, source } = await getPurchaseAuthorityController(
      decoded.userId,
    );
    return NextResponse.json({ authorities, source }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching purchase authorities:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase authorities" },
      { status: 500 },
    );
  }
}
