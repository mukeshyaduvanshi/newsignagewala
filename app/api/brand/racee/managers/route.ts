import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import TeamMember from '@/lib/models/TeamMember';
import RolePermission from '@/lib/models/RolePermission';

export const dynamic = 'force-dynamic';

/**
 * GET /api/brand/racee/managers
 * Get all managers for racee assignment
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

    // Get all managers for this brand
    const managers = await User.find({
      parentId: brandUserId,
      userType: 'manager',
      isActive: true,
    }).select('_id name email');

    // Get work authorities to check Racee permission
    const managersWithPermission = await Promise.all(
      managers.map(async (manager) => {
        // Find the team member for this manager
        const teamMember = await TeamMember.findOne({
          userId: manager._id,
          parentId: brandUserId,
        });

        if (!teamMember) {
          return {
            _id: manager._id,
            name: manager.name,
            email: manager.email,
            teamMemberId: null,
            hasRaceePermission: false,
          };
        }

        const rolePermission = await RolePermission.findOne({
          teamMemberId: teamMember._id,
          parentId: brandUserId,
          isActive: true,
        });

        const hasRaceePermission = rolePermission?.permissions.some(
          (p: any) => p.module.toLowerCase() === 'racee'
        );

        return {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          teamMemberId: teamMember._id,
          hasRaceePermission: hasRaceePermission || false,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: managersWithPermission,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
