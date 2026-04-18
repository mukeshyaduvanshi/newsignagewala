import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import { getStoreAuthorityController } from "@/modules/brands/store-authority/store-authority.controller";

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

    const { data } = await getStoreAuthorityController(decoded.userId);

    return NextResponse.json(
      { message: "Store authorities fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Get store authority error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch store authorities" },
      { status: 500 },
    );
  }
}
