import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { getRatesController } from "@/modules/manager/rates/rates.controller";

export async function GET(req: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(req);

    const searchQuery = req.nextUrl.searchParams.get("search") || "";

    const result = await getRatesController(managerAuth.parentId, searchQuery);
    const data = (result as any).data ?? result;

    return NextResponse.json(
      { message: "Rates fetched successfully", data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching manager rates:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
