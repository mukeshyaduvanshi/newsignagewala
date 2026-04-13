import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Purchase authority ID is required" },
        { status: 400 }
      );
    }

    // Check if authority exists and belongs to this brand
    const authority = await PurchaseAuthority.findOne({
      _id: id,
      brandId: decoded.userId,
    });

    if (!authority) {
      return NextResponse.json(
        { error: "Purchase authority not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await PurchaseAuthority.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json(
      { message: "Purchase authority deactivated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting purchase authority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete purchase authority" },
      { status: 500 }
    );
  }
}
