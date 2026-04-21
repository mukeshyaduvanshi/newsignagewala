/**
 * Manager Stores — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Store from "@/lib/models/Store";
import StoreAssignManager from "@/lib/models/StoreAssignManager";

export async function getStoresByManager(
  managerId: string,
  parentId: string,
  search?: string,
) {
  await dbConnect();

  const assignments = await StoreAssignManager.find({
    managerUserId: managerId,
    parentId,
  }).select("storeId");

  const assignedStoreIds = assignments.map((a: any) => a.storeId);

  if (assignedStoreIds.length === 0) return [];

  const query: any = {
    _id: { $in: assignedStoreIds },
    isActive: true,
  };

  if (search && search.trim()) {
    query.$and = [
      { _id: { $in: assignedStoreIds } },
      {
        $or: [
          { storeName: { $regex: search, $options: "i" } },
          { storePhone: { $regex: search, $options: "i" } },
          { storeAddress: { $regex: search, $options: "i" } },
          { storeCity: { $regex: search, $options: "i" } },
          { storeState: { $regex: search, $options: "i" } },
          { storePincode: { $regex: search, $options: "i" } },
        ],
      },
    ];
    delete query._id;
  }

  return Store.find(query).sort({ createdAt: -1 }).lean();
}
