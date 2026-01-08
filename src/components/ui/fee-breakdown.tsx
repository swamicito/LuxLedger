/**
 * Fee Breakdown Component
 * Money Transparency - USD + XRP side-by-side, fees broken down, tooltips
 */

import { useState, useEffect } from "react";
import {
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Coins,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FeeItem {
  label: string;
  amountUSD: number;
  percentage?: number;
  tooltip: string;
}

interface FeeBreakdownProps {
  subtotalUSD: number;
  xrpRate?: number; // USD per XRP, defaults to mock rate
  fees?: FeeItem[];
  showXRP?: boolean;
  variant?: "compact" | "detailed";
}

const defaultFees = (subtotal: number): FeeItem[] => [
  {
    label: "Platform fee",
    amountUSD: subtotal * 0.025,
    percentage: 2.5,
    tooltip: "Covers marketplace operations, seller verification, and buyer protection services.",
  },
  {
    label: "Escrow fee",
    amountUSD: subtotal * 0.01,
    percentage: 1.0,
    tooltip: "Secures your funds on the XRPL blockchain until transaction conditions are met.",
  },
  {
    label: "Network fee",
    amountUSD: 0.01,
    tooltip: "XRPL transaction fee (typically < $0.01). Paid to network validators, not LuxLedger.",
  },
];

export function FeeBreakdown({
  subtotalUSD,
  xrpRate = 0.52, // Mock rate - in production fetch from API
  fees,
  showXRP = true,
  variant = "detailed",
}: FeeBreakdownProps) {
  const [isOpen, setIsOpen] = useState(variant === "detailed");
  const [currentXrpRate, setCurrentXrpRate] = useState(xrpRate);

  const feeItems = fees || defaultFees(subtotalUSD);
  const totalFees = feeItems.reduce((sum, fee) => sum + fee.amountUSD, 0);
  const grandTotalUSD = subtotalUSD + totalFees;
  const grandTotalXRP = grandTotalUSD / currentXrpRate;

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatXRP = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " XRP";
  };

  const FeeTooltip = ({ tooltip }: { tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="ml-1 text-muted-foreground hover:text-white transition-colors">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <div className="text-right">
            <p className="text-lg font-bold">{formatUSD(grandTotalUSD)}</p>
            {showXRP && (
              <p className="text-xs text-muted-foreground">≈ {formatXRP(grandTotalXRP)}</p>
            )}
          </div>
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
            <span>View fee breakdown</span>
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatUSD(subtotalUSD)}</span>
            </div>
            {feeItems.map((fee, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  {fee.label}
                  {fee.percentage && <span className="ml-1 text-xs">({fee.percentage}%)</span>}
                  <FeeTooltip tooltip={fee.tooltip} />
                </span>
                <span>{formatUSD(fee.amountUSD)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80 p-5">
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-amber-400" />
        Price Breakdown
      </h4>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Item price</span>
          <div className="text-right">
            <span className="font-medium">{formatUSD(subtotalUSD)}</span>
            {showXRP && (
              <span className="text-xs text-muted-foreground ml-2">
                ≈ {formatXRP(subtotalUSD / currentXrpRate)}
              </span>
            )}
          </div>
        </div>

        {/* Fee Items */}
        {feeItems.map((fee, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              {fee.label}
              {fee.percentage && (
                <span className="ml-1 text-xs opacity-70">({fee.percentage}%)</span>
              )}
              <FeeTooltip tooltip={fee.tooltip} />
            </span>
            <div className="text-right">
              <span className="text-sm">{formatUSD(fee.amountUSD)}</span>
              {showXRP && fee.amountUSD > 0.01 && (
                <span className="text-xs text-muted-foreground ml-2">
                  ≈ {formatXRP(fee.amountUSD / currentXrpRate)}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-white/10 my-2" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <div className="text-right">
            <p className="text-xl font-bold text-amber-400">{formatUSD(grandTotalUSD)}</p>
            {showXRP && (
              <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                <Coins className="h-3.5 w-3.5" />
                ≈ {formatXRP(grandTotalXRP)}
              </p>
            )}
          </div>
        </div>

        {/* XRP Rate Info */}
        {showXRP && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Rate: 1 XRP = {formatUSD(currentXrpRate)} (updates at checkout)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline price display with USD + XRP
 */
interface DualPriceProps {
  amountUSD: number;
  xrpRate?: number;
  size?: "sm" | "md" | "lg";
}

export function DualPrice({ amountUSD, xrpRate = 0.52, size = "md" }: DualPriceProps) {
  const xrpAmount = amountUSD / xrpRate;

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatXRP = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " XRP";
  };

  const sizeClasses = {
    sm: { usd: "text-lg font-semibold", xrp: "text-xs" },
    md: { usd: "text-2xl font-bold", xrp: "text-sm" },
    lg: { usd: "text-3xl font-bold", xrp: "text-base" },
  };

  return (
    <div>
      <p className={`${sizeClasses[size].usd} text-amber-400`}>{formatUSD(amountUSD)}</p>
      <p className={`${sizeClasses[size].xrp} text-muted-foreground flex items-center gap-1`}>
        <Coins className="h-3.5 w-3.5" />
        ≈ {formatXRP(xrpAmount)}
      </p>
    </div>
  );
}

/**
 * Fee explanation tooltip for any fee amount
 */
interface FeeTooltipInlineProps {
  label: string;
  amount: number;
  explanation: string;
}

export function FeeTooltipInline({ label, amount, explanation }: FeeTooltipInlineProps) {
  const formatUSD = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amt);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <span className="text-sm text-muted-foreground">{label}</span>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm ml-auto">{formatUSD(amount)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm font-medium mb-1">Why this fee exists</p>
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
