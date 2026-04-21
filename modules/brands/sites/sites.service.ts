/**
 * Brand Sites — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Site from "@/lib/models/Site";
import Store from "@/lib/models/Store";

export async function getSitesByStore(storeId: string) {
  await dbConnect();

  const store = await Store.findById(storeId).lean();
  const sites = await Site.find({ storeId }).sort({ createdAt: -1 }).lean();

  return sites.map((site: any) => ({
    ...site,
    storeName: (store as any)?.storeName || "",
    storeId: (store as any)?._id || "",
    storeLocation: (store as any)?.storeLocation?.coordinates || [],
  }));
}
