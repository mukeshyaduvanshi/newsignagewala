/**
 * SSE: /api/brand/racee/sse
 * Streams real-time RACEE updates to the client via Redis pub/sub
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { createSSEResponse } from "@/lib/utils/sseFactory";
import { BrandSSEChannels } from "@/lib/utils/brand-cache-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 },
    );
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || decoded.userType !== "brand") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  return createSSEResponse(BrandSSEChannels.racee(decoded.userId), req.signal, {
    message: "Racee SSE connected",
    userId: decoded.userId,
  });
}
