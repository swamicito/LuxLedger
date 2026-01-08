import { Crown } from "lucide-react";

interface CrownLottieProps {
  height?: number;
  className?: string;
}

export default function CrownLottie({ height = 48, className = "" }: CrownLottieProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center animate-pulse-glow ${className}`}
      style={{ height }}
    >
      <Crown 
        className="text-yellow-400 drop-shadow-lg" 
        style={{ height: height * 0.8, width: height * 0.8 }} 
      />
    </div>
  );
}
