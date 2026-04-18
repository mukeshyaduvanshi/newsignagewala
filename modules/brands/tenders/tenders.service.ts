/**
 * Brand Tenders — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Tender from "@/lib/models/Tender";
import Cart from "@/lib/models/cart.model";
import User from "@/lib/models/User";

export async function getTendersByBrand(brandId: string) {
  await dbConnect();
  const tenders = await Tender.find({ brandId }).sort({ createdAt: -1 }).lean();

  // Populate vendor info for biddings
  const enriched = await Promise.all(
    tenders.map(async (tender) => {
      if (tender.biddings && tender.biddings.length > 0) {
        const biddingsWithVendor = await Promise.all(
          tender.biddings.map(async (bid: any) => {
            const vendor = await User.findById(bid.vendorId)
              .select("name email phone")
              .lean();
            return { ...bid, vendorInfo: vendor || null };
          }),
        );
        return { ...tender, biddings: biddingsWithVendor };
      }
      return tender;
    }),
  );

  return enriched;
}

export async function createTender(brandId: string, body: any) {
  await dbConnect();

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const count = await Tender.countDocuments();
  const tenderNumber = `TND-${month}${year}-${count + 1}`;

  const tender = (await Tender.create({
    ...body,
    brandId,
    tenderNumber,
    status: "pending",
  })) as any;

  // Remove tendered sites from cart
  if (body.sites && body.sites.length > 0) {
    const siteIds = body.sites.map((s: any) => s.siteId);
    const cart = await Cart.findOne({ brandId });
    if (cart) {
      cart.items = cart.items.filter(
        (item: any) =>
          !siteIds.some(
            (id: string) =>
              id === item.siteId?.toString() || id === item._id?.toString(),
          ),
      );
      await cart.save();
    }
  }

  return tender;
}
