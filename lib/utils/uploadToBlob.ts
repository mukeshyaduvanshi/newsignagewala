import { put, del, list } from '@vercel/blob';
import sharp from 'sharp';
import { UploadOptions, UploadResult } from '@/types/upload.types';

// Re-export original interfaces for compatibility
export type { UploadOptions, UploadResult };

/**
 * Uploads a file to Vercel Blob with optional compression
 * @param options Upload configuration
 * @returns Upload result with URL and size info
 */
export async function uploadToVercelBlob(
  options: UploadOptions
): Promise<UploadResult> {
  const {
    file,
    folder,
    filename,
    maxSizeKB = 500,
    quality = 80,
  } = options;

  const originalSize = file.size;
  let processedBuffer: Buffer;
  let finalSize: number;

  // Check if it's an image
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  if (isImage) {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress image using Sharp
    let sharpInstance = sharp(buffer);

    // Get metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if too large (max 1920px width)
    if (metadata.width && metadata.width > 1920) {
      sharpInstance = sharpInstance.resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Compress based on format
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
    } else if (metadata.format === 'png') {
      sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
    } else if (metadata.format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else {
      // Convert other formats to JPEG
      sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
    }

    processedBuffer = await sharpInstance.toBuffer();
    finalSize = processedBuffer.length;

    // Check if compressed size meets target
    const targetSizeBytes = maxSizeKB * 1024;
    if (finalSize > targetSizeBytes) {
      // Further compress by reducing quality
      const adjustedQuality = Math.max(50, Math.floor(quality * (targetSizeBytes / finalSize)));
      processedBuffer = await sharp(buffer)
        .resize(1920, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: adjustedQuality, mozjpeg: true })
        .toBuffer();
      finalSize = processedBuffer.length;
    }
  } else if (isPDF) {
    // For PDFs, no compression - just upload as is
    const arrayBuffer = await file.arrayBuffer();
    processedBuffer = Buffer.from(arrayBuffer);
    finalSize = processedBuffer.length;
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Generate blob path: folder/filename.ext
  const extension = isImage ? 'jpg' : 'pdf';
  const blobPath = `${folder}/${filename}.${extension}`;

  // Check if file already exists and delete it
  try {
    const { blobs } = await list({ prefix: blobPath, limit: 1 });
    if (blobs.length > 0) {
      await del(blobs[0].url);
      // console.log(`Deleted existing blob: ${blobPath}`);
    }
  } catch (error) {
    // Ignore errors if file doesn't exist
    // console.log(`No existing blob found for: ${blobPath}`);
  }

  // Upload to Vercel Blob
  const blob = await put(blobPath, processedBuffer, {
    access: 'public',
    contentType: isImage ? 'image/jpeg' : 'application/pdf',
    addRandomSuffix: false,
  });

  // Calculate compression ratio
  const compressionRatio = ((1 - finalSize / originalSize) * 100).toFixed(2);

  return {
    url: blob.url,
    originalSize,
    compressedSize: finalSize,
    compressionRatio: `${compressionRatio}%`,
  };
}

/**
 * Helper function to format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
