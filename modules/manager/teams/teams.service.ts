/**
 * Manager Teams — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import UserRole from "@/lib/models/UserRole";
import TeamMember from "@/lib/models/TeamMember";

export async function getAuthoritiesByParent(parentId: string) {
  await dbConnect();
  return UserRole.find({
    parentId,
    isActive: true,
  })
    .select("labelName uniqueKey description createdAt")
    .sort({ labelName: 1 })
    .lean();
}

export async function getMembersByParent(
  parentId: string,
  filters: {
    uniqueKey?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  await dbConnect();

  const {
    uniqueKey,
    status = "active",
    search,
    page = 1,
    limit = 20,
  } = filters;

  const query: any = { parentId };

  if (uniqueKey) query.uniqueKey = uniqueKey;

  if (status !== "all") query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const total = await TeamMember.countDocuments(query);
  const members = await TeamMember.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return { members, total };
}
