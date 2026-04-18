/**
 * BFF: /api/brand/bff/checkout-init
 * Aggregates purchase authorities + creative managers in a single request
 * Used by checkout/page.tsx to eliminate 2 parallel useEffect fetches
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getPurchaseAuthorityController } from "@/modules/brands/purchase-authority/purchase-authority.controller";
import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { BrandCacheKeys, BrandCacheTTL } from "@/lib/utils/brand-cache-keys";
import dbConnect from "@/lib/db/mongodb";
import TeamMember from "@/lib/models/TeamMember";

export const dynamic = "force-dynamic";

async function getCreativeManagers(brandId: string) {
  await dbConnect();
  return TeamMember.find({
    parentId: brandId,
    uniqueKey: "creativeManagers",
    status: "active",
  })
    .select("_id name email uniqueKey status")
    .lean();
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

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

    const brandId = decoded.userId;

    // Fetch both in parallel
    const [{ data: purchaseAuthorities }, { data: creativeManagers }] =
      await Promise.all([
        getPurchaseAuthorityController(brandId),
        getOrSetCache(
          BrandCacheKeys.checkoutInit(brandId),
          () => getCreativeManagers(brandId),
          BrandCacheTTL.checkoutInit,
          `CheckoutInit.creativeManagers[${brandId}]`,
        ),
      ]);

    return NextResponse.json(
      {
        message: "Checkout init data fetched successfully",
        data: {
          purchaseAuthorities,
          creativeManagers,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("BFF checkout-init error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch checkout init data" },
      { status: 500 },
    );
  }
}
