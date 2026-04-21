/**
 * Manager Role Permissions — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import RolePermission from "@/lib/models/RolePermission";

export async function getRolePermissionsByManager(
  uniqueKey: string,
  parentId: string,
) {
  await dbConnect();
  return RolePermission.find({
    teamMemberUniqueKey: uniqueKey,
    parentId,
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .lean();
}
