// File upload types
export interface UploadOptions {
  file: File;
  folder: string; // e.g., companyName from BusinessDetails
  filename: string; // e.g., 'logo', 'companyProfile'
  maxSizeKB?: number; // Maximum size in KB (default: 500KB for images, no compression for PDFs)
  quality?: number; // Image quality 1-100 (default: 80)
}

export interface UploadResult {
  url: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
}
