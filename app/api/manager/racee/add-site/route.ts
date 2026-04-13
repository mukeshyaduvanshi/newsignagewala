import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Racee from '@/lib/models/Racee';
import { getManagerAuth } from '@/lib/auth/manager-auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const managerAuth = await getManagerAuth(req);
    if (!managerAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { raceeId, site } = await req.json();

    if (!raceeId || !site) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log({ raceeId, site });


    // Find the racee
    const racee = await Racee.findById(raceeId);
    if (!racee) {
      return NextResponse.json({ error: 'Racee not found' }, { status: 404 });
    }

    // Initialize sites array if it doesn't exist
    if (!racee.sites) {
      racee.sites = [];
    }

    // Add the new site
    racee.sites.push(site);

    // Save the racee
    await racee.save();

    return NextResponse.json(
      {
        message: 'Site added successfully',
        racee,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error adding site to racee:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
