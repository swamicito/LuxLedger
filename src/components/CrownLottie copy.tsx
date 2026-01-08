import { useEffect, useRef } from "react";
import { Crown } from "lucide-react";

interface CrownLottieProps {
  height?: number;
  className?: string;
}

export default function CrownLottie({ height = 48, className = "" }: CrownLottieProps) {
  const crownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple CSS animation for now - can be replaced with actual Lottie later
    if (crownRef.current) {
      crownRef.current.style.animation = "pulse 2s ease-in-out infinite";
    }
  }, []);

  return (
    <div 
      ref={crownRef}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ height }}
    >
      <Crown 
        className="text-yellow-400 drop-shadow-lg" 
        style={{ height: height * 0.8, width: height * 0.8 }} 
      />
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.3));
          }
          50% { 
            transform: scale(1.05);
            filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.6));
          }
        }
      `}</style>
    </div>
  );
}
