import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Cart from "@/lib/models/cart.model";
import { verifyAccessToken } from "@/lib/auth/jwt";

// POST - Clear entire cart
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Only brands can clear cart" },
        { status: 403 }
      );
    }

    await connectDB();

    const cart = await Cart.findOne({ brandId: decoded.userId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return NextResponse.json({
      success: true,
      message: "Cart cleared",
      items: [],
    });
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear cart" },
      { status: 500 }
    );
  }
}
