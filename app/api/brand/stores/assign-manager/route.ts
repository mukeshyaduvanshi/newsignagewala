import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import User from "@/lib/models/User";
import StoreAssignManager from "@/lib/models/StoreAssignManager";
import TeamMember from "@/lib/models/TeamMember";
import connectDB from "@/lib/db/mongodb";

// GET - Fetch store manager assignments
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const brand = await User.findById(userId);
    if (!brand || brand.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const managerId = searchParams.get("managerId");
    const isUsed = searchParams.get("isUsed");
    const storeIds = searchParams.get("storeIds");
    const checkUsed = searchParams.get("checkUsed");

    // Special case: Check if stores have managers with isStoreUsed = true
    if (checkUsed === "true" && storeIds) {
      const storeIdArray = storeIds.split(",");
      const usedAssignments = await StoreAssignManager.find({
        storeId: { $in: storeIdArray },
        isStoreUsed: true,
        parentId: userId,
      })
        .populate({
          path: "storeId",
          select: "storeName",
          options: { strictPopulate: false },
        })
        .populate({
          path: "managerUserId",
          select: "name",
          options: { strictPopulate: false },
        })
        .lean();

      // Filter out null references
      const validUsedAssignments = usedAssignments.filter(
        (assignment: any) => assignment.storeId && assignment.managerUserId
      );

      return NextResponse.json({
        success: true,
        data: validUsedAssignments,
      });
    }

    // Build query
    const query: any = { parentId: userId };
    if (storeId) query.storeId = storeId;
    if (managerId) query.managerUserId = managerId;
    if (isUsed !== null && isUsed !== undefined) {
      query.isStoreUsed = isUsed === "true";
    }

    // Step 1: Fetch assignments — only populate storeId & managerUserId (NOT teamId)
    // We will NOT use teamId populate because it may reference wrong brand's TeamMember
    const assignments = await StoreAssignManager.find(query)
      .populate({
        path: "storeId",
        select: "storeName storeAddress",
        options: { strictPopulate: false },
      })
      .populate({
        path: "managerUserId",
        select: "name email",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Step 2: Fetch ALL TeamMembers for THIS brand (parentId = brand's userId)
    // This is the SOURCE OF TRUTH for managerType per brand
    // Same person can be RM under Brand A and SM under Brand B
    const brandTeamMembers = await TeamMember.find({
      parentId: userId,
      status: { $in: ["active", "inactive"] },
    }).lean();

    // Step 3: Build lookup map — key: manager's User._id (string), value: TeamMember
    const teamMemberByUserId = new Map<string, any>();
    for (const tm of brandTeamMembers) {
      teamMemberByUserId.set(String(tm.userId), tm);
    }

    // Step 4: For each assignment, find the correct TeamMember from THIS brand
    const validAssignments: any[] = [];
    let orphanedCount = 0;

    for (const assignment of assignments) {
      // Skip if store or manager reference is broken
      if (!assignment.storeId || !assignment.managerUserId) {
        orphanedCount++;
        continue;
      }

      // Get manager's User._id from populated managerUserId
      const mgrUserId = String(
        (assignment.managerUserId as any)?._id || assignment.managerUserId
      );

      // Lookup correct TeamMember for THIS brand using manager's User._id
      const correctTeamMember = teamMemberByUserId.get(mgrUserId);

      if (!correctTeamMember) {
        // Manager exists in StoreAssignManager but NOT in this brand's TeamMember
        // This means the team member was removed from this brand
        orphanedCount++;
        continue;
      }

      // Build the response with correct data from THIS brand's TeamMember
      // Override BOTH teamId AND managerUserId with brand-specific data
      // Because same person can have different name/role under different brands
      // e.g., Brand A named him "Regional Manager 6" but Brand B named him "Rakesh"
      validAssignments.push({
        ...assignment,
        teamId: {
          _id: correctTeamMember._id,
          name: correctTeamMember.name,
          email: correctTeamMember.email,
          phone: correctTeamMember.phone,
          managerType: correctTeamMember.managerType,
          uniqueKey: correctTeamMember.uniqueKey,
        },
        managerUserId: {
          _id: (assignment.managerUserId as any)?._id || assignment.managerUserId,
          name: correctTeamMember.name,
          email: correctTeamMember.email,
        },
      });
    }

    // Log orphaned data for debugging
    if (orphanedCount > 0) {
      console.warn(
        `[assign-manager GET] Found ${orphanedCount} orphaned assignments for brand ${userId}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: validAssignments,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching store assignments:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create bulk store manager assignments
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const brand = await User.findById(userId);
    if (!brand || brand.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: "No assignments data provided" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];

      try {
        // Validate required fields
        if (!assignment.storeId || !assignment.teamId || !assignment.managerUserId) {
          results.errors.push({
            index: i + 1,
            error: "Missing required fields (storeId, teamId, managerUserId)",
          });
          results.skipped++;
          continue;
        }

        // Get the team member details - verify it belongs to this brand via parentId
        const teamMember = await TeamMember.findOne({
          _id: assignment.teamId,
          parentId: userId,
          status: "active",
        });

        if (!teamMember) {
          results.errors.push({
            index: i + 1,
            error: "Team member not found or does not belong to this brand",
          });
          results.skipped++;
          continue;
        }

        // Check if a manager with the same uniqueKey is already assigned to this store
        const existingWithSameUniqueKey = await StoreAssignManager.findOne({
          storeId: assignment.storeId,
          parentId: userId,
        }).populate("teamId");

        if (existingWithSameUniqueKey && existingWithSameUniqueKey.teamId) {
          const existingTeamMember = existingWithSameUniqueKey.teamId as any;
          if (existingTeamMember.uniqueKey === teamMember.uniqueKey) {
            results.errors.push({
              index: i + 1,
              error: `Already assigned: A manager with role "${teamMember.uniqueKey}" is already assigned to this store`,
            });
            results.skipped++;
            continue;
          }
        }

        // Check if exact same assignment already exists
        const existing = await StoreAssignManager.findOne({
          storeId: assignment.storeId,
          teamId: assignment.teamId,
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create new assignment
        await StoreAssignManager.create({
          storeId: assignment.storeId,
          teamId: assignment.teamId,
          parentId: userId,
          managerUserId: assignment.managerUserId,
          isStoreUsed: false,
        });

        results.created++;
      } catch (error: any) {
        console.error(`Error creating assignment ${i + 1}:`, error);
        results.errors.push({
          index: i + 1,
          error: error.message || "Failed to create assignment",
        });
        results.skipped++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Created: ${results.created}, Skipped: ${results.skipped}`,
        data: {
          created: results.created,
          skipped: results.skipped,
          errors: results.errors,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in bulk assignment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update assignment (e.g., toggle isStoreUsed)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const brand = await User.findById(userId);
    if (!brand || brand.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignmentId, isStoreUsed } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const assignment = await StoreAssignManager.findOne({
      _id: assignmentId,
      parentId: userId,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Update isStoreUsed if provided
    if (typeof isStoreUsed === "boolean") {
      assignment.isStoreUsed = isStoreUsed;
      await assignment.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Assignment updated successfully",
        data: assignment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove store manager assignment
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify user is brand
    const brand = await User.findById(userId);
    if (!brand || brand.userType !== "brand") {
      return NextResponse.json(
        { error: "Access denied - Brand only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Check if manager is in use
    const assignment = await StoreAssignManager.findOne({
      _id: assignmentId,
      parentId: userId,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.isStoreUsed) {
      return NextResponse.json(
        { error: "Cannot remove it's currently in use as a working for a store" },
        { status: 400 }
      );
    }

    await StoreAssignManager.findByIdAndDelete(assignmentId);

    return NextResponse.json(
      {
        success: true,
        message: "Assignment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
