# Vercel Blob Upload Utility

Reusable module for uploading files to Vercel Blob with automatic image compression.

## Features

- ✅ Automatic image compression using Sharp
- ✅ Configurable target size and quality
- ✅ Folder organization by company name
- ✅ Support for images (JPG, PNG, WebP) and PDFs
- ✅ Returns compressed file URL and size statistics
- ✅ Type-safe with TypeScript

## Installation

```bash
pnpm add @vercel/blob sharp
```

## Environment Setup

Add to `.env.local`:
```env
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"
```

## Usage

### Import

```typescript
import { uploadToVercelBlob, formatBytes } from '@/lib/utils/uploadToBlob';
```

### Basic Upload (Image with compression)

```typescript
const result = await uploadToVercelBlob({
  file: logoFile, // File object from form
  folder: 'CompanyName', // Folder name in Vercel Blob
  filename: 'logo', // Filename without extension
  maxSizeKB: 300, // Target max size (default: 500KB)
  quality: 85, // Image quality 1-100 (default: 80)
});

console.log(result.url); // https://....vercel-storage.com/CompanyName/logo.jpg
console.log(result.compressionRatio); // "75.5%" (how much reduced)
```

### PDF Upload (No compression)

```typescript
const result = await uploadToVercelBlob({
  file: pdfFile,
  folder: 'CompanyName',
  filename: 'companyProfile',
});

console.log(result.url); // PDF URL
```

### In API Route (Complete Example)

```typescript
import { uploadToVercelBlob, formatBytes } from '@/lib/utils/uploadToBlob';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const companyName = formData.get('companyName') as string;
  const logoFile = formData.get('companyLogo') as File;

  // Sanitize folder name
  const folderName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');

  // Upload logo
  const logoResult = await uploadToVercelBlob({
    file: logoFile,
    folder: folderName,
    filename: 'logo',
    maxSizeKB: 300, // 300KB target
    quality: 85,
  });

  console.log(`Logo: ${formatBytes(logoResult.originalSize)} → ${formatBytes(logoResult.compressedSize)}`);
  // Output: Logo: 2.5 MB → 285 KB

  // Save URL to database
  await BusinessDetails.create({
    companyLogo: logoResult.url,
  });

  return NextResponse.json({ url: logoResult.url });
}
```

### In Component (Frontend)

```typescript
const onSubmit = async (data) => {
  const formData = new FormData();
  formData.append('companyName', data.companyName);
  formData.append('companyLogo', data.companyLogo); // File from input

  const response = await fetch('/api/business/information', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });
};
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `file` | File | Required | File object to upload |
| `folder` | string | Required | Folder path in Vercel Blob |
| `filename` | string | Required | Filename without extension |
| `maxSizeKB` | number | 500 | Target max size in KB (images only) |
| `quality` | number | 80 | Image quality 1-100 |

## Return Value

```typescript
{
  url: string;              // Public URL of uploaded file
  originalSize: number;     // Original file size in bytes
  compressedSize: number;   // Final file size in bytes
  compressionRatio: string; // Percentage reduced (e.g., "75.5%")
}
```

## How It Works

### For Images:
1. Converts File to Buffer
2. Resizes if width > 1920px
3. Compresses based on format (JPEG/PNG/WebP)
4. If still too large, reduces quality further
5. Uploads to Vercel Blob
6. Returns public URL

### For PDFs:
1. Uploads as-is (no compression)
2. Returns public URL

## File Structure in Vercel Blob

```
CompanyName/
├── logo.jpg
└── companyProfile.pdf

AnotherCompany/
├── logo.jpg
└── companyProfile.pdf
```

## Helper Functions

### formatBytes

Converts bytes to human-readable format:

```typescript
formatBytes(1024)       // "1 KB"
formatBytes(1048576)    // "1 MB"
formatBytes(2500000, 1) // "2.4 MB"
```

## Error Handling

```typescript
try {
  const result = await uploadToVercelBlob(options);
} catch (error) {
  if (error.message.includes('Unsupported file type')) {
    // Handle unsupported file type
  }
  console.error('Upload failed:', error);
}
```

## Supported File Types

- **Images**: JPEG, PNG, WebP (auto-compressed)
- **Documents**: PDF (no compression)

## Notes

- Images are automatically converted to JPEG for best compression
- Original aspect ratio is preserved
- Max width is 1920px (configurable in code)
- Sharp uses MozJPEG encoder for best quality/size ratio
- PDFs are uploaded without modification
