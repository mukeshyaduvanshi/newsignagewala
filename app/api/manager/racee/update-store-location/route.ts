import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Racee from "@/lib/models/Racee";
import Store from "@/lib/models/Store";
import { getManagerAuth } from "@/lib/auth/manager-auth";
import { invalidateRaceeCache as invalidateManagerRaceeCache } from "@/modules/manager/racee/racee.controller";
import { invalidateRaceeCache as invalidateBrandRaceeCache } from "@/modules/brands/racee/racee.controller";

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const managerAuth = await getManagerAuth(req);
    if (!managerAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { raceeId, storeLocation } = await req.json();

    if (!raceeId || !storeLocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find and update the racee
    const racee = await Racee.findById(raceeId);
    if (!racee) {
      return NextResponse.json({ error: "Racee not found" }, { status: 404 });
    }

    racee.storeLocation = storeLocation;
    await racee.save();

    // Mirror the captured location on the Store document so the stores list
    // can show the correct map pin count without a separate racee fetch.
    if (racee.storeId) {
      await Store.findByIdAndUpdate(racee.storeId, {
        storeLocation,
      });
    }

    await invalidateManagerRaceeCache(managerAuth.userId).catch(() => {});
    await invalidateBrandRaceeCache(racee.parentId?.toString()).catch(() => {});

    return NextResponse.json(
      {
        message: "Store location updated successfully",
        racee,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating store location:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
