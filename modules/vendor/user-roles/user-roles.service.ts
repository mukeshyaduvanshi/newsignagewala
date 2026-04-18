/**
 * Vendor User Roles — Service Layer
 * Raw DB queries — koi auth nahi, koi HTTP nahi
 */

import dbConnect from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";

export async function getUserRolesByVendor(vendorId: string) {
  await dbConnect();
  return UserRole.find({
    $or: [{ createdId: vendorId }, { parentId: vendorId }],
    isActive: true,
  })
    .select(
      "_id labelName uniqueKey description createdId parentId isActive isUsedInTeam createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();
}
