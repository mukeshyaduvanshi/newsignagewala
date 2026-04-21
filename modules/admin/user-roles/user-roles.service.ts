/**
 * Admin User Roles — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";

export async function getUserRolesByAdmin(adminId: string) {
  await dbConnect();
  return UserRole.find({
    createdId: adminId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();
}
