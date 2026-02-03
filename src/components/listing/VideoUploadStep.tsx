/**
 * VideoUploadStep - Luxury-grade video verification upload component
 * Required for high-value assets (≥$10,000 USD)
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  Upload,
  CheckCircle,
  AlertCircle,
  Play,
  Trash2,
  RefreshCw,
  Clock,
  HardDrive,
  FileVideo,
  Info,
} from 'lucide-react';
import {
  VIDEO_COPY,
  VIDEO_CONSTRAINTS,
  validateVideoFile,
  formatFileSize,
  formatDuration,
  formatThreshold,
  isVideoRequired,
  type VideoValidationResult,
} from '@/lib/video-verification';
import { cn } from '@/lib/utils';

interface VideoUploadStepProps {
  priceUSD: number;
  videoFile: File | null;
  videoUrl: string | null;
  onVideoChange: (file: File | null, url: string | null) => void;
  className?: string;
}

export function VideoUploadStep({
  priceUSD,
  videoFile,
  videoUrl,
  onVideoChange,
  className,
}: VideoUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<VideoValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const required = isVideoRequired(priceUSD);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsValidating(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    const result = await validateVideoFile(file);
    
    clearInterval(progressInterval);
    setUploadProgress(100);
    setValidation(result);
    setIsValidating(false);

    if (result.valid) {
      const url = URL.createObjectURL(file);
      onVideoChange(file, url);
    }
  }, [onVideoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    onVideoChange(null, null);
    setValidation(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [videoUrl, onVideoChange]);

  const handleReplace = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Show full upload UI for all listings - video helps sell!
  // Only difference: "Required" vs "Recommended" badge
  if (!required && !videoUrl) {
    return (
      <Card className={cn('border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80', className)}>
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <Video className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium">Add a Video</h3>
                <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Recommended
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Listings with video sell 3x faster. Show buyers your item in motion to build trust and confidence.
              </p>
            </div>
          </div>

          {/* Specs - condensed */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Clock, label: 'Duration', value: '15-60s' },
              { icon: FileVideo, label: 'Format', value: 'MP4/MOV' },
              { icon: HardDrive, label: 'Max Size', value: '250 MB' },
              { icon: Video, label: 'Audio', value: 'Optional' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-white/5 p-2 text-center">
                <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[0.6rem] text-muted-foreground">{label}</p>
                <p className="text-[0.65rem] font-medium text-white/80">{value}</p>
              </div>
            ))}
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-white/20 hover:border-amber-400/50 hover:bg-white/5',
              isValidating && 'pointer-events-none opacity-60'
            )}
          >
            {isValidating ? (
              <div className="space-y-3">
                <RefreshCw className="h-6 w-6 mx-auto text-amber-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Validating video...</p>
                <Progress value={uploadProgress} className="h-1.5 max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-white/90 mb-1">
                  Drop your video here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4 or MOV • 15–60 seconds • Up to 250 MB
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Validation Error */}
          {validation && !validation.valid && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Video not accepted</p>
                <p className="text-xs text-red-200/80 mt-1">{validation.error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show preview if video uploaded (for optional uploads)
  if (!required && videoUrl) {
    return (
      <Card className={cn('border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-neutral-950', className)}>
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-emerald-300">Video Added</h3>
                <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  ✓ Ready
                </Badge>
              </div>
              <p className="text-xs text-emerald-200/70">
                Great! Your video will help buyers see your item in detail.
              </p>
            </div>
          </div>

          {/* Video Preview */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplace}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,.mp4,.mov"
            onChange={handleInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-neutral-950', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <Video className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-amber-200">{VIDEO_COPY.stepTitle}</h3>
              <Badge className="text-[0.6rem] bg-amber-500/20 text-amber-300 border-amber-500/30">
                Required
              </Badge>
            </div>
            <p className="text-xs text-amber-100/70">
              {VIDEO_COPY.stepDescription}
            </p>
          </div>
        </div>

        {/* Requirements Guide */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-white/90">
            <Info className="h-3.5 w-3.5 text-amber-400" />
            {VIDEO_COPY.requirement.title}
          </div>
          <p className="text-xs text-muted-foreground">{VIDEO_COPY.requirement.description}</p>
          <ul className="space-y-1.5">
            {VIDEO_COPY.requirement.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/80">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[0.7rem] text-amber-200/80 pt-2 border-t border-white/5">
            {VIDEO_COPY.requirement.footer}
          </p>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: 'Duration', value: VIDEO_COPY.specs.duration },
            { icon: FileVideo, label: 'Format', value: VIDEO_COPY.specs.formats },
            { icon: HardDrive, label: 'Max Size', value: VIDEO_COPY.specs.maxSize },
            { icon: Video, label: 'Audio', value: VIDEO_COPY.specs.audio },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg bg-white/5 p-3 text-center">
              <Icon className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-xs font-medium text-white/90">{value}</p>
            </div>
          ))}
        </div>

        {/* Upload Area or Preview */}
        {!videoUrl ? (
          <>
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-white/20 hover:border-amber-400/50 hover:bg-white/5',
                isValidating && 'pointer-events-none opacity-60'
              )}
            >
              {isValidating ? (
                <div className="space-y-3">
                  <RefreshCw className="h-8 w-8 mx-auto text-amber-400 animate-spin" />
                  <p className="text-sm text-muted-foreground">Validating video...</p>
                  <Progress value={uploadProgress} className="h-1.5 max-w-xs mx-auto" />
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-white/90 mb-1">
                    Drop your video here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4 or MOV • 15–60 seconds • Up to 250 MB
                  </p>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Validation Error */}
            {validation && !validation.valid && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Video not accepted</p>
                  <p className="text-xs text-red-200/80 mt-1">{validation.error}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Video Preview */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                poster=""
              />
              {/* Play overlay for first load */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="h-16 w-16 rounded-full bg-amber-500/90 flex items-center justify-center">
                  <Play className="h-8 w-8 text-black ml-1" />
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-emerald-300">{VIDEO_COPY.success.badge}</p>
                    <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      ✓ Valid
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-emerald-200/70">
                    {validation?.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(validation.duration)}
                      </span>
                    )}
                    {validation?.size && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(validation.size)}
                      </span>
                    )}
                    {videoFile && (
                      <span className="truncate max-w-[150px]">{videoFile.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplace}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline validation message for submit button area
export function VideoRequiredMessage({ priceUSD, hasVideo }: { priceUSD: number; hasVideo: boolean }) {
  const required = isVideoRequired(priceUSD);
  
  if (!required || hasVideo) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs text-amber-400">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{VIDEO_COPY.validation.required}</span>
    </div>
  );
}

// Badge for listings
export function VideoVerificationBadge({ 
  hasVideo, 
  required,
  compact = false,
}: { 
  hasVideo: boolean; 
  required: boolean;
  compact?: boolean;
}) {
  if (!required && !hasVideo) return null;
  
  if (hasVideo) {
    return (
      <Badge className={cn(
        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        compact ? 'text-[0.6rem] px-1.5 py-0' : 'text-xs'
      )}>
        <Video className={cn('mr-1', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        {VIDEO_COPY.myListings.verified}
      </Badge>
    );
  }
  
  if (required) {
    return (
      <Badge className={cn(
        'bg-amber-500/20 text-amber-300 border-amber-500/30',
        compact ? 'text-[0.6rem] px-1.5 py-0' : 'text-xs'
      )}>
        <AlertCircle className={cn('mr-1', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        {VIDEO_COPY.myListings.actionRequired}
      </Badge>
    );
  }
  
  return null;
}
