import { NextRequest, NextResponse } from 'next/server';
import { requireManagerAuth } from '@/lib/auth/manager-auth';
import dbConnect from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import Store from '@/lib/models/Store';
import User from '@/lib/models/User';
import TeamMember from '@/lib/models/TeamMember';

export const dynamic = 'force-dynamic';

/**
 * GET /api/manager/racee
 * Get all racee requests assigned to the manager
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Ensure models are registered (important for populate in dev mode)
    Store;
    User;
    TeamMember;

    // Verify authentication - Get manager auth data from JWT token (includes parentId)
    const managerAuth = await requireManagerAuth(req);

    const managerUserId = managerAuth.userId;
    const parentId = managerAuth.parentId; // From JWT token

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build filter - Only show racees from the selected parent/brand
    const filter: any = {
      managerUserId: managerUserId,
      parentId: parentId, // Filter by selected brand/parent
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch racees
    const racees = await Racee.find(filter)
      .populate('storeId', 'storeName storeImage storeAddress storeCity storeState storePincode storeCountry location')
      .populate('managerUserId', 'name email phone')
      .populate('teamId', 'name managerType uniqueKey')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: racees,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching manager racees:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
