/**
 * Shipment Timeline
 * 
 * Visual timeline showing the shipping process from escrow to release.
 * Used in both buyer and seller dashboards.
 * 
 * Timeline:
 * ✓ Payment Locked in Escrow
 * ✓ Seller Preparing Shipment
 * → In Transit (Tracking #)
 * → Delivered
 * → Confirm or Report Issue
 * ✓ Funds Released
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  Clock,
  Package,
  Truck,
  Shield,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

import {
  Shipment,
  ItemCategory,
  TimelineEvent,
  buildTimelineEvents,
  TRUST_COPY,
} from '../types';

interface ShipmentTimelineProps {
  shipment: Shipment | null;
  escrowCreatedAt: Date;
  category: ItemCategory;
  className?: string;
}

export function ShipmentTimeline({
  shipment,
  escrowCreatedAt,
  category,
  className = '',
}: ShipmentTimelineProps) {
  const events = buildTimelineEvents(shipment, escrowCreatedAt, category);

  return (
    <Card className={`border border-white/10 bg-neutral-950 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Shipping Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10" />

          {/* Events */}
          <div className="space-y-4">
            {events.map((event, index) => (
              <TimelineItem key={event.type} event={event} isLast={index === events.length - 1} />
            ))}
          </div>
        </div>

        {/* Trust message */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-400" />
            {TRUST_COPY.ESCROW_PROTECTED}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const getIcon = () => {
    if (event.completed) {
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    }
    if (event.current) {
      return <Circle className="h-5 w-5 text-amber-400 fill-amber-400/20" />;
    }
    return <Circle className="h-5 w-5 text-white/20" />;
  };

  const getTypeIcon = () => {
    switch (event.type) {
      case 'escrow_locked':
        return <DollarSign className="h-3 w-3" />;
      case 'preparing_shipment':
        return <Package className="h-3 w-3" />;
      case 'in_transit':
      case 'shipped':
        return <Truck className="h-3 w-3" />;
      case 'delivered':
        return <Package className="h-3 w-3" />;
      case 'dispute_window_open':
        return <Clock className="h-3 w-3" />;
      case 'buyer_confirmed':
      case 'funds_released':
        return <CheckCircle className="h-3 w-3" />;
      case 'dispute_filed':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex gap-3">
      {/* Icon */}
      <div className="relative z-10 flex-shrink-0">
        {getIcon()}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-${isLast ? '0' : '2'}`}>
        <div className="flex items-center gap-2">
          <p className={`font-medium text-sm ${
            event.completed ? 'text-white' : 
            event.current ? 'text-amber-400' : 
            'text-muted-foreground'
          }`}>
            {event.label}
          </p>
          {event.actionRequired && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              Action Required
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {event.description}
        </p>
        {event.timestamp && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            {new Date(event.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline timeline for list views
 */
export function ShipmentTimelineCompact({
  shipment,
  className = '',
}: {
  shipment: Shipment | null;
  className?: string;
}) {
  if (!shipment) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Clock className="h-4 w-4" />
        <span>Awaiting shipment</span>
      </div>
    );
  }

  const statusConfig: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    pending: {
      icon: <Clock className="h-4 w-4" />,
      text: 'Awaiting shipment',
      color: 'text-muted-foreground',
    },
    in_transit: {
      icon: <Truck className="h-4 w-4" />,
      text: `In transit: ${shipment.tracking_number}`,
      color: 'text-blue-400',
    },
    delivered: {
      icon: <Package className="h-4 w-4" />,
      text: 'Delivered - Awaiting confirmation',
      color: 'text-amber-400',
    },
    confirmed: {
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Confirmed - Funds released',
      color: 'text-emerald-400',
    },
    disputed: {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: 'Dispute in progress',
      color: 'text-red-400',
    },
    cancelled: {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: 'Cancelled',
      color: 'text-neutral-400',
    },
  };

  const config = statusConfig[shipment.status] || statusConfig.pending;

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
