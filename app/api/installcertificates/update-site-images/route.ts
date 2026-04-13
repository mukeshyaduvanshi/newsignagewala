import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import InstallationCertificate from '@/lib/models/InstallationCertificate';
import { ObjectId } from 'mongodb';

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const { certificateId, siteId, capturedImages, installerName, installerPhone, remarks } = await req.json();

    console.log('=== UPDATE SITE IMAGES API CALLED ===');
    console.log('Certificate ID:', certificateId);
    console.log('Site ID:', siteId);
    console.log('Captured Images:', capturedImages);
    console.log('Installer:', installerName, installerPhone);

    if (!certificateId || !siteId) {
      return NextResponse.json(
        { error: 'Certificate ID and Site ID are required' },
        { status: 400 }
      );
    }

    if (!capturedImages || !Array.isArray(capturedImages) || capturedImages.length === 0) {
      return NextResponse.json(
        { error: 'At least one captured image URL is required' },
        { status: 400 }
      );
    }

    if (!installerName || !installerPhone) {
      return NextResponse.json(
        { error: 'Installer name and phone are required' },
        { status: 400 }
      );
    }

    // Find the installation certificate first to get site index
    const certificate = await InstallationCertificate.findById(certificateId);

    if (!certificate) {
      return NextResponse.json(
        { error: 'Installation certificate not found' },
        { status: 404 }
      );
    }

    console.log('Total sites in certificate:', certificate.sites.length);
    console.log('Searching for siteId:', siteId);
    
    // Find the specific site index
    const siteIndex = certificate.sites.findIndex(
      (site: any) => site.siteId.toString() === siteId.toString()
    );

    console.log('Found site at index:', siteIndex);

    if (siteIndex === -1) {
      console.error('Site not found! Available siteIds:', certificate.sites.map((s: any) => s.siteId.toString()));
      return NextResponse.json(
        { error: 'Site not found in certificate' },
        { status: 404 }
      );
    }

    // Check if installer already exists
    const existingInstaller = certificate.sites[siteIndex].installers?.find(
      (installer: any) =>
        installer.name === installerName && installer.phone === installerPhone
    );

    // Build update operations
    const updateOperations: any = {
      $push: {
        [`sites.${siteIndex}.capturedImages`]: { $each: capturedImages }
      },
      $set: {
        [`sites.${siteIndex}.status`]: 'installed'
      }
    };

    // Only add installer if not already exists
    if (!existingInstaller) {
      updateOperations.$push[`sites.${siteIndex}.installers`] = {
        name: installerName,
        phone: installerPhone,
        remarks: remarks || '',
        capturedAt: new Date(),
      };
    }

    console.log('Update operations:', JSON.stringify(updateOperations, null, 2));

    // Execute the update using model's collection (bypasses Mongoose middleware)
    const updateResult = await InstallationCertificate.collection.updateOne(
      { _id: new ObjectId(certificateId) },
      updateOperations
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount === 0 && !updateResult.matchedCount) {
      console.error('No documents were modified!');
      return NextResponse.json(
        { error: 'Failed to update certificate' },
        { status: 500 }
      );
    }

    // Fetch updated document
    const updatedCertificate = await InstallationCertificate.collection.findOne({
      _id: new ObjectId(certificateId)
    });

    if (!updatedCertificate) {
      return NextResponse.json(
        { error: 'Certificate not found after update' },
        { status: 500 }
      );
    }

    const updatedSite = updatedCertificate.sites[siteIndex];

    console.log('After update - capturedImages:', updatedSite.capturedImages);
    console.log('After update - installers:', updatedSite.installers);

    return NextResponse.json({
      success: true,
      message: 'Site images and installer info saved successfully',
      data: {
        siteId: updatedSite.siteId,
        totalImages: updatedSite.capturedImages?.length || 0,
        installers: updatedSite.installers?.length || 0,
        remarks: updatedSite.installers?.map((inst: any) => inst.remarks) || [],
      },
    });
  } catch (error: any) {
    console.error('Error updating installation certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
