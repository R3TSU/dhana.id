// src/lib/r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from 'buffer'; // Node.js Buffer

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL_PREFIX = process.env.R2_PUBLIC_URL_PREFIX?.replace(/\/$/, ''); // Remove trailing slash if present

function sanitizeBasePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
}

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL_PREFIX) {
  if (process.env.NODE_ENV === 'development') {
    console.warn("One or more R2 environment variables are not set. File uploads will likely fail.");
  } else {
    // In production, you might want to throw an error to prevent startup if critical env vars are missing.
    // For now, we'll just log, but this indicates a configuration issue.
    console.error("CRITICAL: R2 environment variables are not fully configured.");
  }
}

const s3Client = new S3Client({
  region: "auto", // For R2, 'auto' is typically used
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadFileToR2(file: File, basePath: string): Promise<{ url: string; key: string } | { error: string }> {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL_PREFIX) {
    return { error: 'R2 Bucket name or public URL prefix is not configured.' };
  }
  try {
    const creds = typeof s3Client.config.credentials === 'function' 
      ? await s3Client.config.credentials() 
      : s3Client.config.credentials;
    if (!creds || !creds.accessKeyId || !creds.secretAccessKey) {
      if(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
        return { error: 'R2 client credentials not properly initialized despite ENV VARS being present.' };
      }
      return { error: 'R2 client credentials are not configured.' };
    }
  } catch (e) {
    console.error('Error resolving S3 client credentials:', e);
    return { error: 'Failed to resolve R2 client credentials.' };
  }


  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const saneBasePath = sanitizeBasePath(basePath);
    if (!saneBasePath) {
      return { error: 'Base path for R2 upload cannot be empty or just slashes.' };
    }
    const key = `${saneBasePath}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
      ACL: 'public-read', // Ensure the object is publicly accessible if your bucket policy allows
    });

    await s3Client.send(command);

    const publicUrl = `${R2_PUBLIC_URL_PREFIX}/${key}`;
    return { url: publicUrl, key: key }; // key might be useful if we store it, or derive from URL for deletion
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    return { error: "Failed to upload file." };
  }
}

export async function deleteFileFromR2(fileUrl: string): Promise<{ success: boolean } | { error: string }> {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL_PREFIX) {
    return { error: 'R2 Bucket name or public URL prefix is not configured.' };
  }
  try {
    const creds = typeof s3Client.config.credentials === 'function' 
      ? await s3Client.config.credentials() 
      : s3Client.config.credentials;
    if (!creds || !creds.accessKeyId || !creds.secretAccessKey) {
      return { error: 'R2 client credentials are not configured.' };
    }
  } catch (e) {
    console.error('Error resolving S3 client credentials for delete:', e);
    return { error: 'Failed to resolve R2 client credentials for delete.' };
  }


  if (!fileUrl.startsWith(R2_PUBLIC_URL_PREFIX)) {
    console.warn(`File URL '${fileUrl}' does not match R2 public prefix. Skipping deletion.`);
    return { error: 'File URL does not belong to the configured R2 bucket.' };
  }

  const key = fileUrl.substring(R2_PUBLIC_URL_PREFIX.length + 1); // +1 for the slash

  if (!key) {
    return { error: 'Could not determine file key from URL.' };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting file '${key}' from R2:`, error);
    return { error: "Failed to delete file from R2." };
  }
}
