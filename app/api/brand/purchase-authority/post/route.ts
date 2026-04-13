import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/mongodb";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import User from "@/lib/models/User";

export async function POST(request: NextRequest) {
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

    const { poNumber, vendorId, issueDate, expiryDate, amount } =
      await request.json();

    // Validate required fields
    if (!poNumber || !vendorId || !issueDate || !expiryDate || !amount) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const vendorDetails = await User.findById(vendorId);
    if (!vendorDetails || vendorDetails.userType !== "vendor") {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    const vendorName = vendorDetails.name;

    // Check if PO Number already exists
    const existingPO = await PurchaseAuthority.findOne({ poNumber });
    if (existingPO) {
      return NextResponse.json(
        { error: "PO Number already exists" },
        { status: 400 },
      );
    }

    // Create new purchase authority
    const authority = await PurchaseAuthority.create({
      poNumber,
      brandId: decoded.userId,
      vendorId,
      vendorName,
      issueDate,
      expiryDate,
      amount,
      isActive: true,
    });

    return NextResponse.json(
      {
        message: "Purchase authority created successfully",
        authority,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating purchase authority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase authority" },
      { status: 500 },
    );
  }
}
