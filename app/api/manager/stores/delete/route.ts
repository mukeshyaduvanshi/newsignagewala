import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/auth/manager-auth";
import Store from "@/lib/models/Store";
import connectDB from "@/lib/db/mongodb";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);


    const { storeId } = await req.json();

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    // Find and soft delete store
    const store = await Store.findOne({
      _id: storeId,
      parentId: managerAuth.parentId, // From JWT token
      isActive: true,
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Soft delete
    store.isActive = false;
    await store.save();

    return NextResponse.json(
      { message: "Store deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: error.status || 500 }
    );
  }
}
