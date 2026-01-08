import { ShieldCheck, Clock, Scale, Truck, AlertTriangle } from "lucide-react";

interface TrustStripProps {
  variant?: "default" | "compact";
  showEscrow?: boolean;
  showVerification?: boolean;
  showDelivery?: boolean;
  showDispute?: boolean;
  className?: string;
}

export function TrustStrip({
  variant = "default",
  showEscrow = true,
  showVerification = true,
  showDelivery = true,
  showDispute = true,
  className = "",
}: TrustStripProps) {
  const items = [
    {
      show: showEscrow,
      icon: ShieldCheck,
      label: "Escrow Protected",
      description: "Funds secured until delivery confirmed",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      show: showVerification,
      icon: Clock,
      label: "Verified Asset",
      description: "Authenticated by LuxLedger experts",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      show: showDelivery,
      icon: Truck,
      label: "Insured Delivery",
      description: "Full coverage during transit",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      show: showDispute,
      icon: Scale,
      label: "Dispute Resolution",
      description: "Fair mediation if issues arise",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ].filter((item) => item.show);

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-950/95 to-neutral-900/95 p-4 ${className}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bgColor}`}
            >
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustBadge({
  type,
  size = "sm",
}: {
  type: "escrow" | "verified" | "insured" | "dispute";
  size?: "sm" | "md";
}) {
  const config = {
    escrow: {
      icon: ShieldCheck,
      label: "Escrow Protected",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
    },
    verified: {
      icon: Clock,
      label: "Verified",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/30",
    },
    insured: {
      icon: Truck,
      label: "Insured",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/30",
    },
    dispute: {
      icon: Scale,
      label: "Protected",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/30",
    },
  }[type];

  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "text-[0.6rem] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${config.bgColor} ${sizeClasses}`}
    >
      <Icon className={`h-2.5 w-2.5 ${config.color}`} />
      <span className={config.color}>{config.label}</span>
    </span>
  );
}
