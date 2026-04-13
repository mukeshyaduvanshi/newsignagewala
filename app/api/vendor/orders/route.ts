import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import Order from "@/lib/models/Order";
import BusinessDetails from "@/lib/models/BusinessDetails";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if user is vendor
    if (decoded.userType !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized. Only vendors can access this endpoint." },
        { status: 403 }
      );
    }

    // Fetch orders where vendorId matches logged-in vendor's userId
    const orders = await Order.find({ vendorId: decoded.userId })
      .sort({ createdAt: -1 })
      .populate("brandId", "email phone") // Get email & phone from User
      .lean();

    // For each order, fetch BusinessDetails (companyName, companyLogo) and merge with User data
    const ordersWithBrandDetails = await Promise.all(
      orders.map(async (order: any) => {
        if (order.brandId && order.brandId._id) {
          // Fetch BusinessDetails where parentId = User's _id
          const businessDetails = await BusinessDetails.findOne({
            parentId: order.brandId._id,
          })
            .select("companyName companyLogo")
            .lean();

          // Merge User data (email, phone) with BusinessDetails (companyName, companyLogo)
          return {
            ...order,
            brandId: {
              _id: order.brandId._id,
              email: order.brandId.email,
              phone: order.brandId.phone,
              companyName: businessDetails?.companyName || null,
              companyLogo: businessDetails?.companyLogo || null,
            },
          };
        }
        return order;
      })
    );

    return NextResponse.json({ orders: ordersWithBrandDetails }, { status: 200 });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
