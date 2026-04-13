import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import StoreAssignManager from '@/lib/models/StoreAssignManager';
import RolePermission from '@/lib/models/RolePermission';
import Store from '@/lib/models/Store';
import User from '@/lib/models/User';
import TeamMember from '@/lib/models/TeamMember';

export const dynamic = 'force-dynamic';

/**
 * POST /api/brand/racee/post
 * Create racee requests for selected stores and manager
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyAccessToken(token);

    if (!decoded || decoded.userType !== 'brand') {
      return NextResponse.json(
        { error: 'Unauthorized - Brand access only' },
        { status: 403 }
      );
    }

    const brandUserId = decoded.userId;

    // Parse request body
    const body = await req.json();
    const { storeIds, managerType } = body;

    console.log({storeIds,managerType});
    console.log('Total storeIds received:', storeIds.length);
    console.log('StoreIds type check:', storeIds.map((id: string) => typeof id));

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one store' },
        { status: 400 }
      );
    }

    if (!managerType) {
      return NextResponse.json(
        { error: 'Please select a manager type' },
        { status: 400 }
      );
    }

    // Step 1: Find all StoreAssignManager entries for the selected stores
    // First, try without isActive filter to see if data exists
    const allAssignments = await StoreAssignManager.find({
      storeId: { $in: storeIds },
    });
    console.log('All assignments (without isActive filter):', allAssignments.length);
    
    // Check isActive field values
    if (allAssignments.length > 0) {
      console.log('Sample isActive values:', allAssignments.slice(0, 3).map((a: any) => ({
        _id: a._id,
        isActive: a.isActive,
        hasIsActiveField: 'isActive' in a
      })));
    }
    
    const storeAssignments = await StoreAssignManager.find({
      storeId: { $in: storeIds },
    }).populate('managerUserId').populate('storeId').populate('teamId');

    console.log('Step 1 - StoreAssignments found:', storeAssignments.length);
    console.log('StoreIds received:', storeIds);
    
    if (storeAssignments.length > 0) {
      console.log('Sample assignment data:', {
        _id: storeAssignments[0]._id,
        storeId: storeAssignments[0].storeId,
        managerUserId: storeAssignments[0].managerUserId,
        teamId: storeAssignments[0].teamId,
        hasParentId: 'parentId' in storeAssignments[0]
      });
    }

    if (!storeAssignments || storeAssignments.length === 0) {
      return NextResponse.json(
        { error: 'No managers assigned to the selected stores' },
        { status: 400 }
      );
    }

    // Step 2: Get all teamIds from these assignments
    const teamIds = storeAssignments
      .map(assignment => {
        // teamId is already populated, extract the _id
        if (assignment.teamId && typeof assignment.teamId === 'object') {
          return (assignment.teamId as any)._id;
        }
        return assignment.teamId;
      })
      .filter(teamId => teamId); // Remove null/undefined

    console.log('Step 2 - TeamIds extracted:', teamIds.length);
    console.log('First 3 teamIds:', teamIds.slice(0, 3).map(id => id.toString()));

    if (teamIds.length === 0) {
      return NextResponse.json(
        { error: 'No team members found for the assigned managers' },
        { status: 400 }
      );
    }

    // Step 3: Find TeamMembers with matching teamIds AND managerType
    const matchingTeamMembers = await TeamMember.find({
      _id: { $in: teamIds },
      uniqueKey: managerType,
      parentId: brandUserId,
      status: 'active',
    });

    console.log('Step 3 - Matching TeamMembers found:', matchingTeamMembers.length);
    console.log('Manager Type searching for:', managerType);

    if (!matchingTeamMembers || matchingTeamMembers.length === 0) {
      return NextResponse.json(
        { error: `No managers of type "${managerType}" are assigned to the selected stores` },
        { status: 400 }
      );
    }

    // Create a Set of matching teamMember IDs for quick lookup
    const matchingTeamMemberIds = new Set(
      matchingTeamMembers.map(tm => tm._id.toString())
    );

    // Step 4: Create racee for each assignment that has a matching team member
    const raceeEntries = [];
    const assignmentRaceeMap = new Map(); // assignmentId -> raceeId

    console.log('Step 4 - Starting racee creation for', storeAssignments.length, 'assignments');

    for (const assignment of storeAssignments) {
      if (!assignment.teamId || !assignment.managerUserId || !assignment.storeId) {
        console.log('Skipping assignment - missing data:', {
          hasTeamId: !!assignment.teamId,
          hasManagerUserId: !!assignment.managerUserId,
          hasStoreId: !!assignment.storeId
        });
        continue;
      }

      const teamIdStr = assignment.teamId && typeof assignment.teamId === 'object'
        ? (assignment.teamId as any)._id.toString()
        : (assignment.teamId as any).toString();
      
      // Check if this assignment's teamMember matches the selected managerType
      if (!matchingTeamMemberIds.has(teamIdStr)) {
        console.log('Skipping assignment - teamId not in matching list. TeamId:', teamIdStr);
        continue;
      }

      const manager = assignment.managerUserId as any;
      const store = assignment.storeId as any;

      console.log('Creating racee for:', {
        storeName: store.storeName,
        managerName: manager.name,
        teamId: assignment.teamId
      });

      // Create racee for this assignment
      const racee = await Racee.create({
        storeId: store._id,
        storeName: store.storeName,
        managerUserId: manager._id,
        managerName: manager.name,
        teamId: assignment.teamId,
        parentId: brandUserId,
        status: 'pending',
      });

      raceeEntries.push(racee);
      assignmentRaceeMap.set(assignment._id.toString(), racee._id);

      // Step 5: Update this StoreAssignManager entry with the racee ID
      await StoreAssignManager.updateOne(
        { _id: assignment._id },
        { $addToSet: { raceeIds: racee._id } }
      );
    }

    console.log('Step 5 - Total racees created:', raceeEntries.length);

    if (raceeEntries.length === 0) {
      return NextResponse.json(
        { error: `No managers of type "${managerType}" are assigned to the selected stores` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully created ${raceeEntries.length} racee request(s)`,
        data: {
          totalRacees: raceeEntries.length,
          storesCount: storeIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating racee requests:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
