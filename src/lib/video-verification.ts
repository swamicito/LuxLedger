/**
 * Video Verification Configuration for LuxLedger
 * High-value assets require video proof for verification and dispute protection.
 */

// Non-negotiable threshold - assets above this require video
export const VIDEO_REQUIRED_THRESHOLD_USD = 10_000;

// Video constraints (50 MB max for Supabase free tier)
export const VIDEO_CONSTRAINTS = {
  minDurationSeconds: 15,
  maxDurationSeconds: 60,
  maxSizeMB: 50,
  maxSizeBytes: 50 * 1024 * 1024,
  acceptedFormats: ['video/mp4', 'video/quicktime', 'video/mov'],
  acceptedExtensions: ['.mp4', '.mov'],
} as const;

// Copy - premium tone, never punitive
export const VIDEO_COPY = {
  stepTitle: 'Video Verification',
  stepDescription: 'Required for high-value asset protection',
  
  requirement: {
    title: 'Required for Verification',
    description: 'Record a continuous video showing:',
    items: [
      'The full asset (no cuts)',
      'Serial numbers / identifying marks',
      'Condition (zoom in on edges, wear, details)',
      'A slow 360° view',
    ],
    footer: 'This video protects both buyers and sellers and is required for high-value listings.',
  },
  
  specs: {
    duration: '15–60 seconds',
    formats: 'MP4 or MOV',
    maxSize: '50 MB',
    audio: 'Optional but encouraged',
  },
  
  validation: {
    required: 'A verification video is required for assets valued over $10,000.',
    tooShort: 'Video must be at least 15 seconds for proper verification.',
    tooLong: 'Video must be under 60 seconds. Focus on key details.',
    tooLarge: 'Video file is too large. Maximum size is 50 MB.',
    invalidFormat: 'Please upload an MP4 or MOV video file.',
  },
  
  success: {
    badge: 'Verification Ready',
    message: 'Your video meets all verification requirements.',
  },
  
  assetDetail: {
    badge: 'Verified Video Proof',
    description: 'This asset includes seller-provided video verification reviewed during listing approval.',
  },
  
  myListings: {
    verified: 'Video Verified',
    required: 'Video Required',
    actionRequired: 'Action Required',
  },
} as const;

// Check if video is required for a given price
export function isVideoRequired(priceUSD: number): boolean {
  return priceUSD >= VIDEO_REQUIRED_THRESHOLD_USD;
}

// Format price for display
export function formatThreshold(): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(VIDEO_REQUIRED_THRESHOLD_USD);
}

// Video validation result
export interface VideoValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
  size?: number;
  format?: string;
}

// Validate video file
export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  // Check format
  const isValidFormat = VIDEO_CONSTRAINTS.acceptedFormats.includes(file.type as any) ||
    VIDEO_CONSTRAINTS.acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!isValidFormat) {
    return { valid: false, error: VIDEO_COPY.validation.invalidFormat };
  }
  
  // Check size
  if (file.size > VIDEO_CONSTRAINTS.maxSizeBytes) {
    return { valid: false, error: VIDEO_COPY.validation.tooLarge, size: file.size };
  }
  
  // Check duration (requires loading video)
  try {
    const duration = await getVideoDuration(file);
    
    if (duration < VIDEO_CONSTRAINTS.minDurationSeconds) {
      return { 
        valid: false, 
        error: VIDEO_COPY.validation.tooShort, 
        duration,
        size: file.size,
        format: file.type,
      };
    }
    
    if (duration > VIDEO_CONSTRAINTS.maxDurationSeconds) {
      return { 
        valid: false, 
        error: VIDEO_COPY.validation.tooLong, 
        duration,
        size: file.size,
        format: file.type,
      };
    }
    
    return {
      valid: true,
      duration,
      size: file.size,
      format: file.type,
    };
  } catch {
    // If we can't read duration, allow it (will be validated server-side)
    return {
      valid: true,
      size: file.size,
      format: file.type,
    };
  }
}

// Get video duration from file
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format duration for display
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
}
