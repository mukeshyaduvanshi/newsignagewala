import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import { getManagerAuth } from '@/lib/auth/manager-auth';

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const managerAuth = await getManagerAuth(req);
    if (!managerAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { raceeId, newStorePhoto, storeLocation } = await req.json();

    if (!raceeId || !newStorePhoto) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find and update the racee
    const racee = await Racee.findById(raceeId);
    if (!racee) {
      return NextResponse.json({ error: 'Racee not found' }, { status: 404 });
    }

    racee.newStorePhoto = newStorePhoto;
    if (storeLocation && storeLocation.coordinates && storeLocation.coordinates.length === 2) {
      racee.storeLocation = {
        type: 'Point',
        coordinates: storeLocation.coordinates,
      };
      console.log('Saving location:', racee.storeLocation);
    }
    await racee.save();

    return NextResponse.json(
      {
        message: 'Store photo updated successfully',
        racee,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating store photo:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
