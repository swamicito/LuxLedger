/**
 * VideoProofDisplay - Display video verification on asset detail pages
 * Cinematic overlay, click-to-play, trust copy
 */

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Video, Shield, Maximize2 } from 'lucide-react';
import { VIDEO_COPY } from '@/lib/video-verification';
import { cn } from '@/lib/utils';

interface VideoProofDisplayProps {
  videoUrl: string;
  posterUrl?: string;
  className?: string;
}

export function VideoProofDisplay({ videoUrl, posterUrl, className }: VideoProofDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowOverlay(false);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoClick = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowOverlay(true);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Trust Badge Header */}
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1.5">
          <Video className="h-3 w-3" />
          {VIDEO_COPY.assetDetail.badge}
        </Badge>
      </div>

      {/* Video Container */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          onClick={handleVideoClick}
          onEnded={handleVideoEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
          preload="metadata"
        />

        {/* Cinematic Play Overlay */}
        {showOverlay && !isPlaying && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent cursor-pointer"
            onClick={handlePlay}
          >
            <div className="h-20 w-20 rounded-full bg-amber-500/90 flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110">
              <Play className="h-10 w-10 text-black ml-1" />
            </div>
            <p className="mt-4 text-sm font-medium text-white/90">Watch Verification Video</p>
            <p className="text-xs text-white/60 mt-1">Seller-provided proof of authenticity</p>
          </div>
        )}

        {/* Controls Overlay (visible on hover when playing) */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePause}
                className="text-white hover:bg-white/20"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Verification Badge Overlay */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span className="text-[0.65rem] font-medium text-emerald-300">Verified</span>
          </div>
        </div>
      </div>

      {/* Trust Copy */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {VIDEO_COPY.assetDetail.description}
      </p>
    </div>
  );
}

// Compact version for grid views
export function VideoProofBadge({ hasVideo }: { hasVideo: boolean }) {
  if (!hasVideo) return null;

  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5">
        <Video className="h-3 w-3 text-emerald-400" />
        <span className="text-[0.6rem] font-medium text-emerald-300">Video</span>
      </div>
    </div>
  );
}
