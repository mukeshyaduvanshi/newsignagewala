import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import { getManagerAuth } from '@/lib/auth/manager-auth';


export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication
    const managerAuth = await getManagerAuth(req);
    if (!managerAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { raceeId, status } = await req.json();

    if (!raceeId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await connectDB();

    const racee = await Racee.findById(raceeId);
    if (!racee) {
      return NextResponse.json({ error: 'Racee not found' }, { status: 404 });
    }

    // Check if user has permission to update this racee
    if (racee.managerUserId.toString() !== managerAuth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    racee.status = status;
    await racee.save();

    return NextResponse.json({
      success: true,
      message: `Racee status updated to ${status}`,
      racee
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating racee status:', error);
    return NextResponse.json({ error: 'Failed to update racee status' }, { status: error.status || 500 });
  }
}
