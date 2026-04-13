import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import Store from '@/lib/models/Store';
import User from '@/lib/models/User';
import TeamMember from '@/lib/models/TeamMember';

export const dynamic = 'force-dynamic';

/**
 * GET /api/brand/racee
 * Get all racee requests for the brand
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Ensure models are registered (important for populate in dev mode)
    Store;
    User;
    TeamMember;

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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build filter
    const filter: any = {
      parentId: brandUserId,
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { managerName: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch racees with full store and team member details
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
    console.error('Error fetching racees:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
