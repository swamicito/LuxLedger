/**
 * Beta Badge Component
 * Subtle "Beta access" tag shown when LAUNCH_MODE=beta
 */

import { getLaunchConfig } from "@/lib/launch-config";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BetaBadgeProps {
  variant?: "header" | "inline" | "floating";
  showTooltip?: boolean;
}

export function BetaBadge({ variant = "header", showTooltip = true }: BetaBadgeProps) {
  const config = getLaunchConfig();
  
  if (!config.isBeta) {
    return null;
  }

  const badge = (
    <Badge
      className={`
        ${variant === "header" ? "text-[0.6rem] px-2 py-0.5" : "text-xs px-2 py-1"}
        ${variant === "floating" ? "fixed top-4 right-4 z-50" : ""}
        bg-gradient-to-r from-amber-500/30 to-amber-400/20 
        border border-amber-500/40 
        text-amber-900
        font-medium uppercase tracking-wider
        backdrop-blur-sm
      `}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      Beta
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm font-medium">Early Access</p>
          <p className="text-xs text-muted-foreground mt-1">
            You're using LuxLedger during our beta period. Some features may be limited.
            Thank you for being an early adopter!
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Beta Notice Banner - more prominent for key pages
 */
export function BetaNoticeBanner() {
  const config = getLaunchConfig();
  
  if (!config.isBeta) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-purple-500/10 border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-2">
        <p className="text-center text-xs text-purple-300">
          <Sparkles className="h-3 w-3 inline mr-1" />
          <span className="font-medium">Beta Access</span>
          <span className="mx-2 opacity-50">•</span>
          <span className="opacity-80">
            You're among the first to experience LuxLedger. 
            <a href="/contact" className="ml-1 underline hover:text-purple-200">
              Share feedback
            </a>
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Invite Code Input for beta broker enrollment
 */
interface InviteCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid?: boolean;
  error?: string;
}

export function InviteCodeInput({ value, onChange, isValid, error }: InviteCodeInputProps) {
  const config = getLaunchConfig();
  
  if (!config.isBeta) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Beta Invite Code
        <span className="text-red-400 ml-1">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="Enter your invite code"
          className={`
            w-full px-4 py-2 rounded-lg
            bg-black/40 border
            ${error ? 'border-red-500/50' : isValid ? 'border-emerald-500/50' : 'border-white/10'}
            text-white placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-purple-500/50
            uppercase tracking-wider
          `}
        />
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-emerald-400 text-sm">✓ Valid</span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        During beta, broker enrollment requires an invite code. 
        <a href="/contact" className="ml-1 text-purple-400 hover:underline">
          Request access
        </a>
      </p>
    </div>
  );
}
