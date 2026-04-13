import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import { getManagerAuth } from '@/lib/auth/manager-auth';


export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const managerAuth = await getManagerAuth(req);
    if (!managerAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { raceeId, siteId } = await req.json();

    if (!raceeId || !siteId) {
      return NextResponse.json(
        { error: 'Racee ID and Site ID are required' },
        { status: 400 }
      );
    }

    // Find the racee
    const racee = await Racee.findById(raceeId);

    if (!racee) {
      return NextResponse.json({ error: 'Racee not found' }, { status: 404 });
    }

    // Check if the user is the manager of this racee
    if (racee.managerUserId.toString() !== managerAuth.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this site' },
        { status: 403 }
      );
    }

    // Remove the site from the sites array
    racee.sites = racee.sites.filter(
      (site: any) => site._id.toString() !== siteId
    );

    await racee.save();

    return NextResponse.json({
      success: true,
      message: 'Site deleted successfully',
      racee,
    });
  } catch (error: any) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete site' },
      { status: error.status || 500 }
    );
  }
}
