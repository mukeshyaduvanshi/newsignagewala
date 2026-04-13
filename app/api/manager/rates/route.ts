import { NextRequest, NextResponse } from 'next/server';
import { requireManagerAuth } from '@/lib/auth/manager-auth';
import BrandRate from '@/lib/models/BrandRate';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get manager auth data from JWT token (includes parentId)
    const managerAuth = await requireManagerAuth(req);

    // Get search query if provided
    const searchQuery = req.nextUrl.searchParams.get('search') || '';
    // console.log({Search: searchQuery});


    // Build search filter
    let searchFilter = {};
    if (searchQuery) {
      searchFilter = {
        $or: [
          { elementName: { $regex: searchQuery, $options: 'i' } },
          { uniqueKey: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }


    // Fetch rates where parentId matches (from JWT token)
    // This ensures manager only sees their brand/vendor's rates
    const rates = await BrandRate.find({
      parentId: managerAuth.parentId, // From JWT token
      isActive: true,
      ...searchFilter,
    })
      .sort({ createdAt: -1 })
      .lean();

    // console.log({ rates: rates });
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
