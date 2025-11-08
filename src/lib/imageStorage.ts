/**
 * AWS S3 Image Storage Service
 * Handles uploading, deleting, and managing images in S3
 */

import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'synapse-bookmarks-images-ishubhgupta';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2000; // Max width/height

export interface ImageUploadResult {
  url: string;
  storageKey: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
}

/**
 * Generate unique storage key for image
 */
function generateStorageKey(userId: string, originalName?: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const extension = originalName?.split('.').pop() || 'jpg';
  return `images/${userId}/${timestamp}-${random}.${extension}`;
}

/**
 * Process and optimize image
 */
async function processImage(buffer: Buffer): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize if too large
  let processedImage = image;
  if (metadata.width && metadata.width > MAX_DIMENSION) {
    processedImage = processedImage.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to WebP for better compression
  processedImage = processedImage.webp({ quality: 85 });

  const outputBuffer = await processedImage.toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    metadata: {
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      size: outputBuffer.length,
      format: 'webp',
    },
  };
}

/**
 * Upload image to S3
 */
export async function uploadImage(
  imageBuffer: Buffer,
  userId: string,
  originalName?: string
): Promise<ImageUploadResult> {
  try {
    // Check size
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    // Process image
    const { buffer: processedBuffer, metadata } = await processImage(imageBuffer);

    // Generate storage key
    const storageKey = generateStorageKey(userId, originalName);

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: storageKey,
        Body: processedBuffer,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000', // 1 year
      },
    });

    await upload.done();

    // Construct public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${storageKey}`;

    console.log(`✅ Image uploaded: ${url}`);

    return {
      url,
      storageKey,
      ...metadata,
    };
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete image from S3
 */
export async function deleteImage(storageKey: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });

    await s3Client.send(command);
    console.log(`✅ Image deleted: ${storageKey}`);
  } catch (error) {
    console.error('❌ Image deletion failed:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if image exists in S3
 */
export async function imageExists(storageKey: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });

    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download image from URL
 */
export async function downloadImageFromUrl(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('❌ Image download failed:', error);
    throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get image metadata without downloading
 */
export async function getImageMetadata(url: string): Promise<ImageMetadata | null> {
  try {
    const buffer = await downloadImageFromUrl(url);
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: buffer.length,
      format: metadata.format || 'unknown',
    };
  } catch (error) {
    console.error('Failed to get image metadata:', error);
    return null;
  }
}
