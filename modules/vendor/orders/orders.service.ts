/**
 * Vendor Orders — Service Layer
 * Raw DB queries — koi auth nahi, koi HTTP nahi
 */

import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import BusinessDetails from "@/lib/models/BusinessDetails";

export async function getOrdersByVendor(vendorId: string) {
  await dbConnect();

  const orders = await Order.find({ vendorId })
    .sort({ createdAt: -1 })
    .populate("brandId", "email phone")
    .lean();

  // Enrich each order with BusinessDetails (companyName, companyLogo)
  const ordersWithBrandDetails = await Promise.all(
    orders.map(async (order: any) => {
      if (order.brandId && order.brandId._id) {
        const businessDetails = await BusinessDetails.findOne({
          parentId: order.brandId._id,
        })
          .select("companyName companyLogo")
          .lean();

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
    }),
  );

  return ordersWithBrandDetails;
}
