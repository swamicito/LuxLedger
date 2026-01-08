/**
 * Supabase Storage utilities for LuxLedger
 * Handles file uploads for assets, videos, and documents
 */

import { supabase } from './supabase-client';

// Storage bucket names
export const STORAGE_BUCKETS = {
  ASSET_IMAGES: 'asset-images',
  ASSET_VIDEOS: 'asset-videos',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Upload result type
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// Progress callback type
export type UploadProgressCallback = (progress: number) => void;

/**
 * Generate a unique file path for uploads
 */
function generateFilePath(
  userId: string,
  fileName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const basePath = prefix ? `${prefix}/${userId}` : userId;
  return `${basePath}/${timestamp}-${randomId}-${sanitizedName}`;
}

/**
 * Get the file extension from a filename
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Upload a video file to Supabase Storage
 */
export async function uploadVideo(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    const filePath = generateFilePath(userId, file.name, 'videos');
    
    // Simulate progress for now (Supabase JS doesn't have built-in progress)
    if (onProgress) {
      onProgress(10);
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.ASSET_VIDEOS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (onProgress) {
      onProgress(90);
    }

    if (error) {
      console.error('Video upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload video',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.ASSET_VIDEOS)
      .getPublicUrl(data.path);

    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Video upload exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    const filePath = generateFilePath(userId, file.name, 'images');

    if (onProgress) {
      onProgress(10);
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.ASSET_IMAGES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (onProgress) {
      onProgress(90);
    }

    if (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.ASSET_IMAGES)
      .getPublicUrl(data.path);

    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Image upload exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  userId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], userId);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  
  return results;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown delete error',
    };
  }
}

/**
 * Get a signed URL for private files (if needed)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
