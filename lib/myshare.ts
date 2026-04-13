// myshare.ts — MyShare file upload utility
const BASE       = process.env.MYSHARE_BASE_URL || 'http://localhost:5000/v2';
const APP_ID     = process.env.MYSHARE_APP_ID    || '';
const API_KEY    = process.env.MYSHARE_API_KEY   || '';
const SECRET_KEY = process.env.MYSHARE_SECRET_KEY || '';

const AUTH_HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'X-App-Id':      APP_ID,
  'X-Secret-Key':  SECRET_KEY,
  'Content-Type':  'application/json',
};

export interface MyShareUploadResult {
  fileId: string;
  url: string;
  expiresAt: string;
}

export async function uploadFile(
  file: File,
  { expiryDays = 7, recipientEmail }: { expiryDays?: number; recipientEmail?: string } = {}
): Promise<MyShareUploadResult> {
  // 1. Init — get presigned URL
  const initRes = await fetch(`${BASE}/upload/init`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      expiryDays,
    }),
  });
  if (!initRes.ok) throw new Error(await initRes.text());
  const { fileId, uploadUrl, objectKey } = await initRes.json();

  // 2. PUT file directly to MinIO (no auth headers needed here)
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // 3. Complete — save metadata
  const doneRes = await fetch(`${BASE}/upload/complete`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      fileId,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      objectKey,
      expiryDays,
      recipientEmail,
    }),
  });
  if (!doneRes.ok) throw new Error(await doneRes.text());
  return doneRes.json(); // { fileId, url, expiresAt }
}
