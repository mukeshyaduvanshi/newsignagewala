import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getOrdersController } from "@/modules/vendor/orders/orders.controller";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.substring(7);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    if (decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized. Only vendors can access this endpoint." },
        { status: 403 },
      );
    }

    const { data: orders } = await getOrdersController(decoded.userId);

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
