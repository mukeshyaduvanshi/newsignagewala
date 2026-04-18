import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import { invalidatePurchaseAuthorityCache } from "@/modules/brands/purchase-authority/purchase-authority.controller";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    await dbConnect();

    const { id, poNumber, vendorId, issueDate, expiryDate, amount } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Purchase authority ID is required" },
        { status: 400 },
      );
    }

    // Check if authority exists and belongs to this brand
    const existingAuthority = await PurchaseAuthority.findOne({
      _id: id,
      brandId: decoded.userId,
    });

    if (!existingAuthority) {
      return NextResponse.json(
        { error: "Purchase authority not found" },
        { status: 404 },
      );
    }

    // Check if PO Number is being changed and if it already exists
    if (poNumber && poNumber !== existingAuthority.poNumber) {
      const duplicatePO = await PurchaseAuthority.findOne({
        poNumber,
        _id: { $ne: id },
      });
      if (duplicatePO) {
        return NextResponse.json(
          { error: "PO Number already exists" },
          { status: 400 },
        );
      }
    }

    // Update purchase authority
    const updatedAuthority = await PurchaseAuthority.findByIdAndUpdate(
      id,
      {
        poNumber,
        vendorId,
        issueDate,
        expiryDate,
        amount,
      },
      { new: true, runValidators: true },
    );

    await invalidatePurchaseAuthorityCache(decoded.userId).catch(() => {});
    return NextResponse.json(
      {
        message: "Purchase authority updated successfully",
        authority: updatedAuthority,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating purchase authority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update purchase authority" },
      { status: 500 },
    );
  }
}
