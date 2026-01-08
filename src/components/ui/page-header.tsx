import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  backHref?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  label,
  title,
  description,
  backHref,
  action,
  className = "",
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-white/10 bg-black/40 transition-all hover:bg-white/5 hover:scale-105"
              onClick={() => navigate(backHref)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            {label && (
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
                {label}
              </p>
            )}
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = "4xl",
  className = "",
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div className="min-h-screen bg-background">
      <div className={`mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 ${maxWidthClasses} ${className}`}>
        {children}
      </div>
    </div>
  );
}
