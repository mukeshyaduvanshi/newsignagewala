import { requireManagerAuth } from "@/lib/auth/manager-auth";
import connectDB from "@/lib/db/mongodb";
import BrandRate from "@/lib/models/BrandRate";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);

    const { rateId } = await req.json();

    // Validation
    if (!rateId) {
      return NextResponse.json(
        { error: "Rate ID is required" },
        { status: 400 }
      );
    }

    // Find the rate
    const existingRate = await BrandRate.findById(rateId);
    if (!existingRate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }

    // Check ownership - manager can delete only brands rates brand creating under them
    if (existingRate.parentId.toString() !== managerAuth.parentId.toString()) {
      return NextResponse.json(
        { error: "Access denied - Not your brand rate" },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    const deleteRate = await BrandRate.findByIdAndUpdate(
      rateId,
      { isActive: false },
      { new: true }
    );

    return NextResponse.json(
      {
        message: "Brand rate deleted successfully",
        data: deleteRate,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in delete rate route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete brand rate" },
      { status: error.status || 500 }
    );
  }
}
