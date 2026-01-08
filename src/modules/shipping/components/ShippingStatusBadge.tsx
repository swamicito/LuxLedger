/**
 * Shipping Status Badge
 * Clean, consistent status display
 */

import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Truck, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { ShipmentStatus } from '../types';

interface ShippingStatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<ShipmentStatus, {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Awaiting Shipment',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: <Clock className="h-3 w-3" />,
  },
  in_transit: {
    label: 'In Transit',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Truck className="h-3 w-3" />,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <Package className="h-3 w-3" />,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  disputed: {
    label: 'Disputed',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function ShippingStatusBadge({ 
  status, 
  className = '',
  showIcon = true,
}: ShippingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <Badge className={`${config.className} ${className}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
