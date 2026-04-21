/**
 * Admin Role Permissions — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";
import mongoose from "mongoose";

export async function getRolePermissionsByAdmin(adminId: string) {
  await dbConnect();
  const userId = new mongoose.Types.ObjectId(adminId);
  return RolePermission.find({
    createdId: userId,
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .lean();
}
