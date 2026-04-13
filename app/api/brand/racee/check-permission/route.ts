import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongodb';
import RolePermission from '@/lib/models/RolePermission';
import TeamMember from '@/lib/models/TeamMember';
import UserRole from '@/lib/models/UserRole';

export const dynamic = 'force-dynamic';

/**
 * GET /api/brand/racee/check-permission
 * Check if a manager type has Racee permission in RolePermission
 */
export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const managerType = searchParams.get('managerType');

    if (!managerType) {
      return NextResponse.json(
        { error: 'Manager type is required' },
        { status: 400 }
      );
    }

    // Find the TeamMember entry for this manager type
    const teamMember = await TeamMember.findOne({
      parentId: brandUserId,
      uniqueKey: managerType,
      status: 'active',
    });

    if (!teamMember) {
      return NextResponse.json({
        success: true,
        data: { hasPermission: false },
      });
    }

    // Check RolePermission for this manager type (by teamMemberUniqueKey)
    const rolePermission = await RolePermission.findOne({
      teamMemberUniqueKey: managerType,
      parentId: brandUserId,
      isActive: true,
    });

    let hasPermission = false;

    if (rolePermission) {
      // Check if Racee module exists in permissions and view is enabled
      const raceePermission = rolePermission.permissions.find(
        (p: any) => p.module.toLowerCase() === 'racee'
      );
      // Permission is considered active only if view is true
      hasPermission = raceePermission?.view === true;
    }

    // Get UserRole to get the labelName
    const userRole = await UserRole.findOne({
      parentId: brandUserId,
      uniqueKey: teamMember.uniqueKey,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        hasPermission,
        teamMemberId: teamMember._id,
        teamMemberName: userRole?.labelName || teamMember.managerType,
      },
    });
  } catch (error: any) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
