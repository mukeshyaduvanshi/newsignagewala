/**
 * Vendor Role Permissions — Service Layer
 * Raw DB queries — koi auth nahi, koi HTTP nahi
 */

import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import mongoose from "mongoose";

export async function getRolePermissionsByVendor(vendorId: string) {
  await dbConnect();
  const userId = new mongoose.Types.ObjectId(vendorId);
  return RolePermission.find({
    $or: [{ createdId: userId }, { parentId: userId }],
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .lean();
}
