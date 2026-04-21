import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { getStoresController } from "@/modules/manager/stores/stores.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const result = await getStoresController(
      managerAuth.userId,
      managerAuth.parentId,
      search,
    );

    const data = (result as any).data ?? result;
    return NextResponse.json(
      { message: "Stores fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching manager stores:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
