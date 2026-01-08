/**
 * Support Widgets
 * Auto-response messaging, SLA expectations, escalation copy
 */

import { useState } from "react";
import { getSupportConfig } from "@/lib/launch-config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Mail,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * SLA Expectations Banner
 * Shows response time expectations prominently
 */
export function SLABanner() {
  const support = getSupportConfig();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
      <Clock className="h-5 w-5 text-amber-400 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-300">
          Response time: {support.slaText}
        </p>
        <p className="text-xs text-amber-300/70 mt-0.5">
          Our team reviews all messages and responds within {support.slaHours} hours during business days.
        </p>
      </div>
    </div>
  );
}

/**
 * Auto-Response Confirmation
 * Shown after form submission
 */
interface AutoResponseProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string;
  type?: "contact" | "dispute" | "support";
}

export function AutoResponseDialog({ isOpen, onClose, ticketId, type = "contact" }: AutoResponseProps) {
  const support = getSupportConfig();

  const messages = {
    contact: {
      title: "Message Received",
      description: "Thank you for reaching out to LuxLedger.",
      next: "Our team will review your message and respond within",
    },
    dispute: {
      title: "Dispute Filed",
      description: "Your dispute has been submitted for review.",
      next: "Our resolution team will investigate and respond within",
    },
    support: {
      title: "Support Request Received",
      description: "We've received your support request.",
      next: "A support specialist will respond within",
    },
  };

  const msg = messages[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border border-white/10 bg-neutral-950 max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <DialogTitle className="text-center text-xl">{msg.title}</DialogTitle>
          <DialogDescription className="text-center">
            {msg.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {ticketId && (
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Reference Number</p>
              <p className="text-lg font-mono font-bold text-amber-400">{ticketId}</p>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <Clock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">
                {msg.next} <strong>{support.slaText}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive a confirmation email at your registered address.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <Mail className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">Check your inbox</p>
              <p className="text-xs text-muted-foreground mt-1">
                We've sent a confirmation to your email. Check spam if you don't see it.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Escalation Copy for Disputes
 * Clear messaging about what happens next
 */
export function EscalationNotice({ stage }: { stage: "filed" | "review" | "escalated" }) {
  const stages = {
    filed: {
      icon: Clock,
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10 border-yellow-500/20",
      title: "Dispute Filed",
      description: "Your dispute is in queue for review.",
      timeline: "Initial review within 24 hours",
      action: "You can add more evidence while waiting.",
    },
    review: {
      icon: MessageCircle,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      title: "Under Review",
      description: "Our team is actively investigating your case.",
      timeline: "Resolution expected within 48-72 hours",
      action: "You'll be notified of any updates via email.",
    },
    escalated: {
      icon: AlertTriangle,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
      title: "Escalated to Senior Review",
      description: "Your case requires additional investigation.",
      timeline: "Senior review within 72-96 hours",
      action: "A senior specialist will contact you directly.",
    },
  };

  const s = stages[stage];
  const Icon = s.icon;

  return (
    <Card className={`border ${s.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${s.iconColor} mt-0.5 shrink-0`} />
          <div className="flex-1">
            <p className="font-medium">{s.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{s.timeline}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>{s.action}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Support Contact Card
 * Shows all support options with SLA
 */
export function SupportContactCard() {
  const support = getSupportConfig();

  return (
    <Card className="border border-white/10 bg-neutral-950">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold">Need Help?</h3>
        
        <div className="space-y-3">
          <a
            href={`mailto:${support.email}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Mail className="h-5 w-5 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Email Support</p>
              <p className="text-xs text-muted-foreground">{support.email}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <a
            href="/help"
            className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            <MessageCircle className="h-5 w-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Help Center</p>
              <p className="text-xs text-muted-foreground">FAQs and guides</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Response time: {support.slaText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline SLA indicator
 */
export function SLAIndicator({ compact = false }: { compact?: boolean }) {
  const support = getSupportConfig();

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {support.slaText} response
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4 text-amber-400" />
      <span>We respond within <strong className="text-white">{support.slaText}</strong></span>
    </div>
  );
}
