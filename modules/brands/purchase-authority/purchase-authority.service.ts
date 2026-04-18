/**
 * Brand Purchase Authority — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import PurchaseAuthority from "@/lib/models/PurchaseAuthority";
import User from "@/lib/models/User";

export async function getPurchaseAuthoritiesByBrand(brandId: string) {
  await dbConnect();
  const authorities = await PurchaseAuthority.find({ brandId })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    authorities.map(async (auth) => {
      const vendor = await User.findById(auth.vendorId)
        .select("name email")
        .lean();
      return {
        ...auth,
        vendorName: vendor?.name || "Unknown",
        vendorEmail: vendor?.email || "",
      };
    }),
  );
}
