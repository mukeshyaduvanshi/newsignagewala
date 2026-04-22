/**
 * Manager Orders — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Order from "@/lib/models/Order";
import TeamMember from "@/lib/models/TeamMember";
import mongoose from "mongoose";

export async function getOrdersByManager(
  managerId: string,
  teamMemberId?: string,
  parentId?: string,
) {
  await dbConnect();

  let resolvedTeamMemberId: mongoose.Types.ObjectId;

  if (teamMemberId) {
    resolvedTeamMemberId = new mongoose.Types.ObjectId(teamMemberId);
  } else {
    const managerUserObjectId = new mongoose.Types.ObjectId(managerId);
    const query: any = { userId: managerUserObjectId, status: "active" };
    if (parentId) query.parentId = new mongoose.Types.ObjectId(parentId);
    const teamMember = await TeamMember.findOne(query);
    if (!teamMember) return [];
    resolvedTeamMemberId = teamMember._id;
  }

  return Order.find({ creativeManagerId: resolvedTeamMemberId })
    .populate("vendorId", "companyName email phone")
    .populate("brandId", "companyName email phone")
    .sort({ createdAt: -1 })
    .lean();
}
