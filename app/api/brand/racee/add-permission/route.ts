import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongodb';
import RolePermission from '@/lib/models/RolePermission';
import TeamMember from '@/lib/models/TeamMember';
import UserRole from '@/lib/models/UserRole';

export const dynamic = 'force-dynamic';

/**
 * POST /api/brand/racee/add-permission
 * Add Racee permission to a manager type's RolePermission
 * Creates RolePermission entry if it doesn't exist
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
    const body = await req.json();
    const { managerType } = body;

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
      return NextResponse.json(
        { error: 'Manager type not found' },
        { status: 400 }
      );
    }

    // Check if RolePermission exists for this manager type (by teamMemberUniqueKey)
    let rolePermission = await RolePermission.findOne({
      teamMemberUniqueKey: managerType,
      parentId: brandUserId,
      isActive: true,
    });

    if (rolePermission) {
      // RolePermission already exists for this manager type
      // Check if Racee permission already exists
      const raceePermissionIndex = rolePermission.permissions.findIndex(
        (p: any) => p.module.toLowerCase() === 'racee'
      );

      if (raceePermissionIndex !== -1) {
        // Racee permission exists - check if view is already enabled
        const raceePermission = rolePermission.permissions[raceePermissionIndex] as any;
        
        if (raceePermission.view === true) {
          return NextResponse.json({
            success: true,
            message: 'Racee permission already enabled for this manager type',
          });
        }

        // Enable view for existing Racee permission
        raceePermission.view = true;
        raceePermission.edit = true; 
        rolePermission.markModified('permissions');
        await rolePermission.save();

        return NextResponse.json({
          success: true,
          message: 'Racee permission enabled successfully',
        });
      }

      // Racee permission doesn't exist - add it to existing RolePermission
      rolePermission.permissions.push({
        module: 'Racee',
        add: false,
        edit: false,
        view: true,
        delete: false,
        bulk: false,
        request: false,
      } as any);

      await rolePermission.save();

      return NextResponse.json({
        success: true,
        message: 'Racee permission added to existing Role Permission',
      });
    } else {
      // RolePermission doesn't exist - create new one with Racee permission
      // Get UserRole to get the labelName
      const userRole = await UserRole.findOne({
        parentId: brandUserId,
        uniqueKey: teamMember.uniqueKey,
        isActive: true,
      });

      const labelName = userRole?.labelName || teamMember.managerType;

      rolePermission = await RolePermission.create({
        teamMemberId: teamMember._id,
        teamMemberName: labelName,
        teamMemberUniqueKey: teamMember.uniqueKey,
        permissions: [
          {
            module: 'Racee',
            add: false,
            edit: false,
            view: true,
            delete: false,
            bulk: false,
            request: false,
          },
        ],
        createdId: brandUserId,
        parentId: brandUserId,
        isActive: true,
        isUsedInWork: false,
      });

      return NextResponse.json({
        success: true,
        message: 'Role Permission created with Racee permission',
      });
    }
  } catch (error: any) {
    console.error('Error adding permission:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
