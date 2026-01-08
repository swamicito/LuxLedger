import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Package,
  Search,
  ShoppingBag,
  Bell,
  Activity,
  Wallet,
  FileText,
  Users,
  TrendingUp,
  Shield,
  type LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 text-balance">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="min-w-[140px]"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              className="text-muted-foreground"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyMarketplace({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="No assets found"
      description="Try adjusting your filters or check back later for new listings."
      action={
        onBrowse
          ? { label: 'Clear Filters', onClick: onBrowse, variant: 'outline' }
          : undefined
      }
    />
  );
}

export function EmptySearch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title={`No results for "${query}"`}
      description="Try a different search term or browse all available items."
      action={{ label: 'Clear Search', onClick: onClear, variant: 'outline' }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="You're all caught up"
      description="No new notifications. We'll let you know when something important happens."
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={Activity}
      title="No activity yet"
      description="Your transaction history will appear here once you start trading."
    />
  );
}

export function EmptyPortfolio({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={Wallet}
      title="Your portfolio is empty"
      description="Start building your collection by exploring the marketplace."
      action={{ label: 'Browse Marketplace', onClick: onBrowse }}
    />
  );
}

export function EmptyListings({ onList }: { onList: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No listings yet"
      description="List your first asset to start selling on LuxLedger."
      action={{ label: 'List an Asset', onClick: onList }}
    />
  );
}

export function EmptyDocuments() {
  return (
    <EmptyState
      icon={FileText}
      title="No documents"
      description="Upload verification documents to complete your profile."
    />
  );
}

export function EmptyReferrals({ onShare }: { onShare: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No referrals yet"
      description="Share your referral link to start earning commissions."
      action={{ label: 'Get Referral Link', onClick: onShare }}
    />
  );
}

export function EmptyTrades() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No active trades"
      description="Your open trades and offers will appear here."
    />
  );
}

export function EmptyEscrow() {
  return (
    <EmptyState
      icon={Shield}
      title="No escrow transactions"
      description="Escrow protects both buyers and sellers. Your escrow history will appear here."
    />
  );
}
