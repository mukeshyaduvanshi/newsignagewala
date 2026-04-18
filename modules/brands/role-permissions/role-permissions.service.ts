/**
 * Brand Role Permissions — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import mongoose from "mongoose";

export async function getRolePermissionsByBrand(brandId: string) {
  await dbConnect();
  const userId = new mongoose.Types.ObjectId(brandId);
  return RolePermission.find({
    $or: [{ createdId: userId }, { parentId: userId }],
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .lean();
}
