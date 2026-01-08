import { Skeleton } from "@/components/ui/skeleton";

export function AssetCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80 overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full bg-white/5" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20 bg-white/5" />
          <Skeleton className="h-4 w-16 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function AssetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AssetCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5">
      <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40 bg-white/5" />
        <Skeleton className="h-3 w-24 bg-white/5" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-20 bg-white/5 ml-auto" />
        <Skeleton className="h-3 w-16 bg-white/5 ml-auto" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-white/5">
      <Skeleton className="h-8 w-8 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48 bg-white/5" />
        <Skeleton className="h-3 w-full max-w-xs bg-white/5" />
        <Skeleton className="h-3 w-20 bg-white/5" />
      </div>
    </div>
  );
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-white/5 bg-black/20 p-4">
      <Skeleton className="h-20 w-20 rounded-lg bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40 bg-white/5" />
        <Skeleton className="h-3 w-24 bg-white/5" />
        <Skeleton className="h-3 w-32 bg-white/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-16 bg-white/5" />
        <Skeleton className="h-3 w-12 bg-white/5" />
      </div>
    </div>
  );
}

export function ListingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full bg-white/5" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-white/5" />
          <Skeleton className="h-4 w-48 bg-white/5" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
            <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
      <Skeleton className="h-24 w-48 rounded-xl bg-white/5" />
    </div>
  );
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80 p-4">
          <Skeleton className="h-3 w-16 bg-white/5 mb-2" />
          <Skeleton className="h-6 w-12 bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24 bg-white/5" />
      <Skeleton className="h-6 w-48 bg-white/5" />
      <Skeleton className="h-4 w-64 bg-white/5" />
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];

  return (
    <div className={`${sizeClasses} animate-spin rounded-full border-2 border-white/10 border-t-amber-400`} />
  );
}

export function LoadingMoreIndicator({ text = "Loading more..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

export function EndOfListIndicator({ text = "You've reached the end" }: { text?: string }) {
  return (
    <div className="py-6 text-center text-xs text-muted-foreground/70">
      {text}
    </div>
  );
}
