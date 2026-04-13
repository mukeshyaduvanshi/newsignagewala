import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongodb';
import BrandRate from '@/lib/models/BrandRate';
import VendorRate from '@/lib/models/VendorRate';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    await dbConnect();

    // Fetch brand rates with newElement: true
    const brandRates = await BrandRate.find({
      newElement: true,
      isActive: true,
    })
      .populate('createdId', 'name email')
      .lean();

    // Fetch vendor rates with newElement: true
    const vendorRates = await VendorRate.find({
      newElement: true,
      isActive: true,
    })
      .populate('createdId', 'name email')
      .lean();

    // Format brand rates
    const brandRequests = brandRates.map((rate: any) => ({
      _id: rate._id.toString(),
      source: 'brand',
      elementName: rate.elementName,
      description: rate.description,
      rateType: rate.rateType,
      measurementUnit: rate.measurementUnit,
      calculateUnit: rate.calculateUnit,
      width: rate.width,
      height: rate.height,
      rate: rate.rate,
      instruction: rate.instruction,
      imageUrl: rate.imageUrl,
      createdBy: {
        name: rate.createdId?.name || 'Unknown',
        email: rate.createdId?.email || 'Unknown',
      },
      createdAt: rate.createdAt,
    }));

    // Format vendor rates
    const vendorRequests = vendorRates.map((rate: any) => ({
      _id: rate._id.toString(),
      source: 'vendor',
      elementName: rate.elementName,
      description: rate.description,
      rateType: rate.rateType,
      measurementUnit: rate.measurementUnit,
      calculateUnit: rate.calculateUnit,
      width: rate.width,
      height: rate.height,
      rate: rate.rate,
      instruction: rate.instruction,
      imageUrl: rate.imageUrl,
      createdBy: {
        name: rate.createdId?.name || 'Unknown',
        email: rate.createdId?.email || 'Unknown',
      },
      createdAt: rate.createdAt,
    }));

    // Combine both and sort by createdAt (newest first)
    const allRequests = [...brandRequests, ...vendorRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allRequests,
    });
  } catch (error: any) {
    console.error('Error fetching new element requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch new element requests' },
      { status: 500 }
    );
  }
}
