import { NextRequest, NextResponse } from 'next/server';
import { uploadToVercelBlob } from '@/lib/utils/uploadToBlob';

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();

    console.log('=== UPLOAD IMAGES API CALLED ===');
    console.log('Number of images received:', images?.length || 0);

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      console.log(`Uploading image ${i + 1}/${images.length}...`);
      const base64Image = images[i];
      
      // Convert base64 to buffer
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create a File-like object from buffer
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      const file = new File([blob], `site-${Date.now()}-${i}.jpg`, { type: 'image/jpeg' });

      // Upload to Vercel Blob
      const result = await uploadToVercelBlob({
        file,
        folder: 'installation-sites',
        filename: `site-${Date.now()}-${i}.jpg`,
        maxSizeKB: 500,
        quality: 80,
      });

      console.log(`Image ${i + 1} uploaded:`, result.url);
      uploadedUrls.push(result.url);
    }

    console.log('All images uploaded successfully. Total URLs:', uploadedUrls.length);

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload images' },
      { status: 500 }
    );
  }
}
