/**
 * SSE: /api/vendor/orders/sse
 * Streams real-time order updates to the client via Redis pub/sub
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { createSSEResponse } from "@/lib/utils/sseFactory";
import { VendorSSEChannels } from "@/lib/utils/vendor-cache-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 },
    );
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || decoded.userType !== "vendor") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  return createSSEResponse(
    VendorSSEChannels.orders(decoded.userId),
    req.signal,
    { message: "Orders SSE connected", userId: decoded.userId },
  );
}
