/**
 * Admin Rates — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import MasterRate from "@/lib/models/MasterRate";

export async function getRatesByAdmin(adminId: string) {
  await dbConnect();
  return MasterRate.find({
    createdId: adminId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();
}
