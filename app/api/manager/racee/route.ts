import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { getRaceeController } from "@/modules/manager/racee/racee.controller";

export const dynamic = "force-dynamic";

/**
 * GET /api/manager/racee
 * Get all racee requests assigned to the manager
 */
export async function GET(req: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await getRaceeController(
      managerAuth.userId,
      managerAuth.parentId,
      { status: status ?? undefined, search: search ?? undefined },
    );

    const data = (result as any).data ?? result;
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching manager racees:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
