/**
 * Escape Hatches Components
 * Every high-stakes flow needs: Cancel, Save for later, Contextual help
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  X,
  ArrowLeft,
  Save,
  HelpCircle,
  MessageCircle,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EscapeHatchesProps {
  onCancel?: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  helpContext?: string; // e.g., "purchase", "listing", "escrow"
  showSave?: boolean;
  variant?: "inline" | "floating" | "header";
}

const helpLinks: Record<string, { title: string; href: string }[]> = {
  purchase: [
    { title: "How escrow protects you", href: "/help#escrow" },
    { title: "Payment methods", href: "/help#payments" },
    { title: "What if something goes wrong?", href: "/disputes" },
  ],
  listing: [
    { title: "Listing requirements", href: "/help#listing" },
    { title: "Verification process", href: "/help#verification" },
    { title: "Pricing your asset", href: "/help#pricing" },
  ],
  escrow: [
    { title: "How escrow works", href: "/help#escrow" },
    { title: "Release conditions", href: "/help#escrow-release" },
    { title: "Dispute resolution", href: "/disputes" },
  ],
  subscription: [
    { title: "Plan comparison", href: "/subscription" },
    { title: "Billing FAQ", href: "/help#billing" },
    { title: "Cancel or downgrade", href: "/help#cancel" },
  ],
  default: [
    { title: "Help Center", href: "/help" },
    { title: "Contact Support", href: "/contact" },
    { title: "FAQs", href: "/help#faq" },
  ],
};

export function EscapeHatches({
  onCancel,
  onSave,
  cancelLabel = "Cancel and return",
  saveLabel = "Save and finish later",
  helpContext = "default",
  showSave = true,
  variant = "inline",
}: EscapeHatchesProps) {
  const navigate = useNavigate();
  const contextHelp = helpLinks[helpContext] || helpLinks.default;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  if (variant === "floating") {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-neutral-950/95 backdrop-blur-sm px-4 py-2 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          {showSave && onSave && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="text-muted-foreground hover:text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          )}
          <div className="w-px h-4 bg-white/10" />
          <ContextualHelp context={helpContext} />
        </div>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className="flex items-center justify-between py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground hover:text-white gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {cancelLabel}
        </Button>
        <div className="flex items-center gap-2">
          {showSave && onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {saveLabel}
            </Button>
          )}
          <ContextualHelp context={helpContext} />
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        className="text-muted-foreground hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {cancelLabel}
      </Button>
      {showSave && onSave && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="text-muted-foreground hover:text-white"
        >
          <Save className="h-4 w-4 mr-1" />
          {saveLabel}
        </Button>
      )}
      <div className="ml-auto">
        <ContextualHelp context={helpContext} />
      </div>
    </div>
  );
}

/**
 * Contextual Help Dropdown
 */
interface ContextualHelpProps {
  context?: string;
  triggerVariant?: "icon" | "text";
}

export function ContextualHelp({ context = "default", triggerVariant = "text" }: ContextualHelpProps) {
  const navigate = useNavigate();
  const links = helpLinks[context] || helpLinks.default;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerVariant === "icon" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <HelpCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 gap-1">
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-white/10 bg-neutral-950">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Related Help
          </p>
        </div>
        {links.map((link, i) => (
          <DropdownMenuItem
            key={i}
            onClick={() => navigate(link.href)}
            className="cursor-pointer"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {link.title}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/contact")}
          className="cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Support
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Simple back button with confirmation for unsaved changes
 */
interface BackButtonProps {
  hasUnsavedChanges?: boolean;
  onConfirmLeave?: () => void;
  label?: string;
}

export function BackButton({ hasUnsavedChanges = false, onConfirmLeave, label = "Back" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (confirmed) {
        onConfirmLeave?.();
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="text-muted-foreground hover:text-white gap-1"
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

/**
 * Progress indicator with save/exit options
 */
interface FlowProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  onSave?: () => void;
  onExit?: () => void;
}

export function FlowProgress({ currentStep, totalSteps, stepLabels, onSave, onExit }: FlowProgressProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit || (() => navigate(-1))}
          className="text-muted-foreground hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors ${
                  i < currentStep
                    ? "bg-emerald-400"
                    : i === currentStep
                    ? "bg-amber-400"
                    : "bg-white/20"
                }`}
              />
              {stepLabels && stepLabels[i] && i === currentStep && (
                <span className="text-sm text-muted-foreground">{stepLabels[i]}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {onSave && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save and finish later</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
