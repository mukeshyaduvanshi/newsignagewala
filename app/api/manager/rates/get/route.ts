import { NextRequest, NextResponse } from 'next/server';
import { requireManagerAuth } from '@/lib/auth/manager-auth';
import BrandRate from '@/lib/models/BrandRate';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get manager authentication from JWT token
    const managerAuth = await requireManagerAuth(req);

    // Fetch rates where parentId matches manager's parentId
    // This ensures manager only sees their brand/vendor's rates
    const rates = await BrandRate.find({
      parentId: managerAuth.parentId, // From JWT token
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    // console.log('📊 Fetched Rates Count:', rates.length);
    // console.log('📊 Fetched Rates:', rates);

    return NextResponse.json(
      {
        message: 'Rates fetched successfully',
        data: rates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching manager rates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
