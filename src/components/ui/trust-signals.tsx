/**
 * Trust Signals Components
 * Proof-of-Reality signals that build user confidence
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Clock,
  CheckCircle,
  ExternalLink,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
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

/**
 * A. Proof-of-Reality Signals
 */

interface TrustBadgeProps {
  variant?: "escrow" | "verification" | "dispute" | "custody";
  showLink?: boolean;
  compact?: boolean;
}

export function TrustBadge({ variant = "escrow", showLink = true, compact = false }: TrustBadgeProps) {
  const badges = {
    escrow: {
      icon: Shield,
      text: "Escrow protected by XRPL",
      description: "Your funds are held in a decentralized escrow on the XRP Ledger until conditions are met.",
      link: "/help#escrow",
      linkText: "How escrow works →",
    },
    verification: {
      icon: CheckCircle,
      text: "Verified listing",
      description: "This asset has been reviewed and verified by our curation team.",
      link: "/help#verification",
      linkText: "Verification standards →",
    },
    dispute: {
      icon: Clock,
      text: "48-72hr dispute resolution",
      description: "If something goes wrong, our team reviews all evidence and resolves disputes within 48-72 hours.",
      link: "/disputes",
      linkText: "Learn about disputes →",
    },
    custody: {
      icon: Lock,
      text: "Non-custodial",
      description: "LuxLedger never holds your funds. All transactions occur directly on-chain via smart escrow.",
      link: "/help#security",
      linkText: "Security details →",
    },
  };

  const badge = badges[variant];
  const Icon = badge.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <Icon className="h-3.5 w-3.5" />
              <span>{badge.text}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{badge.description}</p>
            {showLink && (
              <Link to={badge.link} className="text-xs text-amber-400 hover:underline mt-1 block">
                {badge.linkText}
              </Link>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
      <Icon className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-300">{badge.text}</p>
        <p className="text-xs text-emerald-300/70 mt-0.5">{badge.description}</p>
        {showLink && (
          <Link to={badge.link} className="text-xs text-amber-400 hover:underline mt-1 inline-block">
            {badge.linkText}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Verification Standards - bullet list, not PDF
 */
export function VerificationStandards() {
  const [isOpen, setIsOpen] = useState(false);

  const standards = [
    "Identity verification of seller (KYC)",
    "Proof of ownership documentation",
    "Third-party appraisal for items over $10,000",
    "Authenticity certificate when applicable",
    "High-resolution photos from multiple angles",
    "Provenance history for collectibles & art",
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
        <CheckCircle className="h-4 w-4" />
        <span>Verification standards</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <ul className="space-y-2">
            {standards.map((standard, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{standard}</span>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Dispute Resolution Timeline - plain English
 */
export function DisputeTimeline() {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    { time: "0-2 hours", action: "Dispute filed, funds frozen in escrow" },
    { time: "2-24 hours", action: "Both parties submit evidence" },
    { time: "24-48 hours", action: "LuxLedger team reviews case" },
    { time: "48-72 hours", action: "Decision made, funds released to winner" },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
        <Clock className="h-4 w-4" />
        <span>Dispute resolution timeline</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  {i < steps.length - 1 && <div className="w-0.5 h-6 bg-white/10" />}
                </div>
                <div className="flex-1 -mt-0.5">
                  <p className="text-xs font-medium text-amber-300">{step.time}</p>
                  <p className="text-sm text-muted-foreground">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Trust Signals Panel - combines all proof-of-reality signals
 */
export function TrustSignalsPanel() {
  return (
    <div className="space-y-4">
      <TrustBadge variant="escrow" />
      <TrustBadge variant="custody" />
      <div className="space-y-3 pt-2">
        <VerificationStandards />
        <DisputeTimeline />
      </div>
    </div>
  );
}

/**
 * Compact trust strip for headers/footers
 */
export function TrustStripCompact() {
  return (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <TrustBadge variant="escrow" compact />
      <TrustBadge variant="custody" compact />
      <TrustBadge variant="dispute" compact />
    </div>
  );
}
