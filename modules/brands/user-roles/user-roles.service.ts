/**
 * Brand User Roles — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";

export async function getUserRolesByBrand(brandId: string) {
  await dbConnect();
  return UserRole.find({
    $or: [{ createdId: brandId }, { parentId: brandId }],
    isActive: true,
  })
    .select(
      "_id labelName uniqueKey description createdId parentId isActive isUsedInTeam createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();
}
