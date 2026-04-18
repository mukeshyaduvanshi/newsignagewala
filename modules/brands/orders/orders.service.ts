/**
 * Brand Orders — Service Layer
 * Raw DB queries — koi auth nahi, koi HTTP nahi
 */

import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import Cart from "@/lib/models/cart.model";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import mongoose from "mongoose";

export interface CreateOrderInput {
  brandId: string;
  vendorId: string;
  creativeManagerId?: string;
  orderNumber: string;
  poNumber: string;
  orderDate: Date;
  deadlineDate: Date;
  orderType: string;
  globalCreativeLink?: string;
  notes?: string;
  additionalCharges?: { label: string; amount: string }[];
  sites: any[];
  subtotal: number;
  additionalChargesTotal: number;
  tax: number;
  total: number;
}

export async function getOrdersByBrand(brandId: string) {
  await dbConnect();
  return Order.find({ brandId })
    .sort({ createdAt: -1 })
    .populate("vendorId", "companyName email phone")
    .lean();
}

export async function createOrder(input: CreateOrderInput) {
  await dbConnect();

  const {
    brandId,
    vendorId,
    creativeManagerId,
    orderNumber,
    poNumber,
    orderDate,
    deadlineDate,
    orderType,
    globalCreativeLink,
    notes,
    additionalCharges,
    sites,
    subtotal,
    additionalChargesTotal,
    tax,
    total,
  } = input;

  const newOrder = new Order({
    brandId: new mongoose.Types.ObjectId(brandId),
    vendorId: new mongoose.Types.ObjectId(vendorId),
    creativeManagerId: creativeManagerId
      ? new mongoose.Types.ObjectId(creativeManagerId)
      : undefined,
    orderNumber,
    poNumber,
    orderDate: new Date(orderDate),
    deadlineDate: new Date(deadlineDate),
    orderType,
    globalCreativeLink,
    notes,
    additionalCharges: additionalCharges || [],
    sites: sites.map((site: any) => ({
      siteId: new mongoose.Types.ObjectId(site.siteId),
      elementName: site.elementName,
      siteDescription: site.siteDescription,
      storeName: site.storeName,
      storeId: new mongoose.Types.ObjectId(site.storeId),
      storeLocation: site.storeLocation,
      storeAddress: site.storeAddress,
      storeCity: site.storeCity,
      storeState: site.storeState,
      storePincode: site.storePincode,
      photo: site.photo,
      width: site.width,
      height: site.height,
      measurementUnit: site.measurementUnit,
      rate: site.rate,
      calculateUnit: site.calculateUnit,
      quantity: site.quantity,
      creativeLink: site.creativeLink,
      instructions: site.instructions,
    })),
    subtotal,
    additionalChargesTotal,
    tax,
    total,
    orderStatus: creativeManagerId ? "creativeaddepted" : "new",
  });

  await newOrder.save();

  // Update purchase authority used amount
  if (poNumber) {
    try {
      const pa = await PurchaseAuthority.findOne({
        poNumber,
        brandId,
        isActive: true,
      });
      if (pa) {
        pa.usedAmount = (pa.usedAmount || 0) + total;
        await pa.save();
      }
    } catch (err) {
      console.error("PA update failed (non-fatal):", err);
    }
  }

  // Remove ordered sites from cart
  const cart = await Cart.findOne({ brandId });
  if (cart) {
    const orderedSiteIds = sites.map((s: any) => s.siteId);
    cart.items = cart.items.filter(
      (item: any) =>
        !orderedSiteIds.some(
          (id: string) =>
            item.siteId.toString() === id || item._id.toString() === id,
        ),
    );
    await cart.save();
  }

  return newOrder;
}

export async function generateOrderNumber(): Promise<string> {
  await dbConnect();
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const count = await Order.countDocuments();
  return `ORD-${month}${year}-${count + 1}`;
}
