import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db/mongodb";
import Racee from "@/lib/models/Racee";
import Site from "@/lib/models/Site";
import Store from "@/lib/models/Store";
import { invalidateRaceeCache } from "@/modules/brands/racee/racee.controller";

export async function POST(req: NextRequest) {
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
        { error: "Forbidden - Only brands can approve racees" },
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
    const racee = await Racee.findById(raceeId).populate("storeId");

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

    // Check if racee has sites
    if (!racee.sites || racee.sites.length === 0) {
      return NextResponse.json(
        { error: "Cannot approve - Racee has no sites" },
        { status: 400 },
      );
    }

    // Create sites in Sites collection
    const sitesToCreate = racee.sites.map((site: any) => ({
      storeId: racee.storeId,
      raceeId: racee._id,
      rateId: site.rateId,
      elementName: site.elementName,
      description: site.description,
      rateType: site.rateType,
      measurementUnit: site.measurementUnit,
      calculateUnit: site.calculateUnit,
      width: site.width,
      height: site.height,
      rate: site.rate,
      photo: site.photo,
      siteDescription: site.siteDescription,
      createdAt: site.createdAt,
      approvedAt: new Date(),
    }));

    await Site.insertMany(sitesToCreate);

    // Update store with new photo and location if available
    const storeIdToUpdate =
      typeof racee.storeId === "object" ? racee.storeId._id : racee.storeId;

    if (storeIdToUpdate) {
      const updateData: any = {};

      if (racee.newStorePhoto) {
        updateData.storeImage = racee.newStorePhoto;
      }

      if (
        racee.storeLocation &&
        racee.storeLocation.coordinates &&
        racee.storeLocation.coordinates.length > 0
      ) {
        updateData.storeLocation = {
          type: "Point",
          coordinates: racee.storeLocation.coordinates,
        };
      }

      if (Object.keys(updateData).length > 0) {
        const updatedStore = await Store.findByIdAndUpdate(
          storeIdToUpdate,
          { $set: updateData },
          { new: true },
        );
        console.log("Store updated:", updatedStore);
      }
    }

    // Update racee status to approved
    racee.status = "approved";
    await racee.save();

    await invalidateRaceeCache(decoded.userId).catch(() => {});
    return NextResponse.json({
      success: true,
      message: "Racee approved and sites created successfully",
      data: {
        raceeId: racee._id,
        sitesCreated: sitesToCreate.length,
      },
    });
  } catch (error: any) {
    console.error("Error approving racee:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
