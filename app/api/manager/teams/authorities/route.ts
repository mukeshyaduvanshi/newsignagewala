import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { getAuthoritiesController } from "@/modules/manager/teams/teams.controller";

export const dynamic = "force-dynamic";

// GET - fetch team authorities/roles from the manager's parent brand
export async function GET(request: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(request);

    const result = await getAuthoritiesController(managerAuth.parentId);
    const data = (result as any).data ?? result;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
