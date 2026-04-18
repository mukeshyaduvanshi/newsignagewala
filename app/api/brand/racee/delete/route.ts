import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db/mongodb";
import Racee from "@/lib/models/Racee";
import Site from "@/lib/models/Site";
import { invalidateRaceeCache } from "@/modules/brands/racee/racee.controller";

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    // Extract and verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Internal server error - JWT secret not configured" },
        { status: 500 },
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Check if user is brand
    const userRole = decoded.userType || decoded.role;
    if (userRole !== "brand") {
      return NextResponse.json(
        { error: "Forbidden - Only brands can delete racees" },
        { status: 403 },
      );
    }

    const { raceeId } = await req.json();

    if (!raceeId) {
      return NextResponse.json(
        { error: "Racee ID is required" },
        { status: 400 },
      );
    }

    // Find the racee
    const racee = await Racee.findById(raceeId);

    if (!racee) {
      return NextResponse.json({ error: "Racee not found" }, { status: 404 });
    }

    // Check if racee belongs to this brand
    if (racee.parentId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden - This racee does not belong to you" },
        { status: 403 },
      );
    }

    // Delete associated sites if they exist
    if (racee.status === "approved" && racee._id) {
      await Site.deleteMany({ raceeId: racee._id });
    }

    // Delete the racee
    await Racee.findByIdAndDelete(raceeId);

    await invalidateRaceeCache(decoded.userId).catch(() => {});
    return NextResponse.json({
      success: true,
      message: "Racee deleted successfully",
      data: {
        raceeId: raceeId,
      },
    });
  } catch (error: any) {
    console.error("Error deleting racee:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
