/**
 * Brand Racee — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Racee from "@/lib/models/Racee";
import Store from "@/lib/models/Store";
import User from "@/lib/models/User";
import TeamMember from "@/lib/models/TeamMember";

export async function getRaceeByBrand(
  brandId: string,
  filters: { status?: string; search?: string } = {},
) {
  await dbConnect();
  // Ensure models registered (dev hot-reload)
  void Store;
  void User;
  void TeamMember;

  const filter: any = { parentId: brandId };
  if (filters.status && filters.status !== "all")
    filter.status = filters.status;
  if (filters.search) {
    filter.$or = [
      { storeName: { $regex: filters.search, $options: "i" } },
      { managerName: { $regex: filters.search, $options: "i" } },
    ];
  }

  return Racee.find(filter)
    .populate(
      "storeId",
      "storeName storeImage storeAddress storeCity storeState storePincode storeCountry location",
    )
    .populate("managerUserId", "name email phone")
    .populate("teamId", "name managerType uniqueKey")
    .sort({ createdAt: -1 })
    .lean();
}
