import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Cart from "@/lib/models/cart.model";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  getCartController,
  invalidateCartCache,
} from "@/modules/brands/cart/cart.controller";

// GET - Fetch brand's cart
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded || decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Only brands can access cart" },
        { status: 403 },
      );
    }

    const { data: items } = await getCartController(decoded.userId);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

// POST - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Only brands can add to cart" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      siteId,
      elementName,
      siteDescription,
      photo,
      width,
      height,
      measurementUnit,
      rate,
      calculateUnit,
      storeId,
      storeName,
      storeLocation,
    } = body;

    if (
      !siteId ||
      !elementName ||
      !width ||
      !height ||
      !measurementUnit ||
      !rate ||
      !calculateUnit
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDB();

    let cart = await Cart.findOne({ brandId: decoded.userId });

    if (!cart) {
      cart = new Cart({
        brandId: decoded.userId,
        items: [],
      });
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.siteId.toString() === siteId,
    );

    if (existingItemIndex > -1) {
      // Increase quantity
      cart.items[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cart.items.push({
        siteId,
        elementName,
        siteDescription,
        photo,
        width,
        height,
        measurementUnit,
        rate,
        calculateUnit,
        quantity: 1,
        addedAt: new Date(),
        storeId,
        storeName,
        storeLocation,
      });
    }

    await cart.save();
    await invalidateCartCache(decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      items: cart.items,
    });
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add to cart" },
      { status: 500 },
    );
  }
}

// PUT - Update item quantity
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Only brands can update cart" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { siteId, quantity } = body;

    if (!siteId || quantity < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connectDB();

    const cart = await Cart.findOne({ brandId: decoded.userId });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.siteId.toString() === siteId,
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 },
      );
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await invalidateCartCache(decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Cart updated",
      items: cart.items,
    });
  } catch (error: any) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update cart" },
      { status: 500 },
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.userType !== "brand") {
      return NextResponse.json(
        { error: "Only brands can modify cart" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    await connectDB();

    const cart = await Cart.findOne({ brandId: decoded.userId });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item: any) => item.siteId.toString() !== siteId,
    );

    if (cart.items.length === initialLength) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 },
      );
    }

    await cart.save();
    await invalidateCartCache(decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
      items: cart.items,
    });
  } catch (error: any) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove from cart" },
      { status: 500 },
    );
  }
}
