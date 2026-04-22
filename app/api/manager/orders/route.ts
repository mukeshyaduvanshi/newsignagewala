import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import { getOrdersController } from "@/modules/manager/orders/orders.controller";

export async function GET(req: NextRequest) {
  try {
    const managerAuth = await requireManagerAuth(req);

    const result = await getOrdersController(
      managerAuth.userId,
      managerAuth.teamMemberId,
      managerAuth.parentId,
    );

    const orders = (result as any).data ?? result;
    return NextResponse.json(
      { message: "Orders fetched successfully", orders },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching manager orders:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
