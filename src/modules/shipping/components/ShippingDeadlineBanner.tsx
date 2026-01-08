/**
 * Shipping Deadline Banner
 * 
 * Displays countdown for sellers to ship within SLA.
 * Shows urgency levels and consequences of missing deadline.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  AlertTriangle,
  Package,
  ArrowRight,
} from 'lucide-react';

import {
  Shipment,
  ItemCategory,
  getShippingDeadline,
  getDaysUntilShippingDeadline,
  isShippingOverdue,
  CATEGORY_REQUIREMENTS,
} from '../types';

interface ShippingDeadlineBannerProps {
  shipment: Shipment;
  category: ItemCategory;
  onAddShipping: () => void;
  className?: string;
}

type UrgencyLevel = 'ok' | 'warning' | 'urgent' | 'overdue';

export function ShippingDeadlineBanner({
  shipment,
  category,
  onAddShipping,
  className = '',
}: ShippingDeadlineBannerProps) {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const updateRemaining = () => {
      const days = getDaysUntilShippingDeadline(shipment.created_at, category);
      setDaysRemaining(days);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [shipment.created_at, category]);

  // Only show for pending status
  if (shipment.status !== 'pending') {
    return null;
  }

  const requirements = CATEGORY_REQUIREMENTS[category];
  const deadline = getShippingDeadline(shipment.created_at, category);
  const isOverdue = isShippingOverdue(shipment.created_at, category, shipment.status);

  // Determine urgency level
  const getUrgencyLevel = (): UrgencyLevel => {
    if (isOverdue) return 'overdue';
    if (daysRemaining <= 1) return 'urgent';
    if (daysRemaining <= 2) return 'warning';
    return 'ok';
  };

  const urgency = getUrgencyLevel();

  // Configuration based on urgency
  const urgencyConfig: Record<UrgencyLevel, {
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: React.ReactNode;
    title: string;
  }> = {
    ok: {
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      icon: <Clock className="h-5 w-5" />,
      title: 'Ship by deadline',
    },
    warning: {
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      icon: <Clock className="h-5 w-5" />,
      title: 'Ship soon',
    },
    urgent: {
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Ship immediately',
    },
    overdue: {
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-400',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Shipping overdue',
    },
  };

  const config = urgencyConfig[urgency];

  // Calculate progress
  const totalDays = requirements.shippingSLADays;
  const elapsedDays = totalDays - daysRemaining;
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  const formatDeadline = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={`border ${config.borderColor} ${config.bgColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${config.bgColor} ${config.textColor}`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={`font-semibold ${config.textColor}`}>{config.title}</h4>
              {urgency === 'overdue' && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  Overdue
                </Badge>
              )}
              {urgency === 'urgent' && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                  Urgent
                </Badge>
              )}
            </div>

            {/* Time remaining */}
            {!isOverdue && (
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${config.textColor}`}>
                    {daysRemaining}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    day{daysRemaining !== 1 ? 's' : ''} remaining
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Deadline: {formatDeadline(deadline)}
                </p>
              </div>
            )}

            {/* Overdue message */}
            {isOverdue && (
              <div className="mt-2">
                <p className="text-sm text-red-400">
                  The shipping deadline has passed. Ship immediately to avoid cancellation.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deadline was: {formatDeadline(deadline)}
                </p>
              </div>
            )}

            {/* Progress bar */}
            {!isOverdue && (
              <div className="mt-3">
                <Progress 
                  value={progressPercent} 
                  className={`h-1.5 ${
                    urgency === 'warning' || urgency === 'urgent' 
                      ? 'bg-amber-500/20' 
                      : 'bg-blue-500/20'
                  }`}
                />
              </div>
            )}

            {/* Action button */}
            <Button
              onClick={onAddShipping}
              size="sm"
              className={`mt-3 ${
                urgency === 'urgent' || urgency === 'overdue'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-black'
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Add Shipping Info
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Warning message */}
        {(urgency === 'urgent' || urgency === 'overdue') && (
          <div className="mt-4 pt-3 border-t border-red-500/20">
            <p className="text-xs text-red-400/80">
              ⚠️ Failure to ship on time may result in order cancellation and impact your seller rating.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline version for list views
 */
export function ShippingDeadlineInline({
  shipment,
  category,
  className = '',
}: {
  shipment: Shipment;
  category: ItemCategory;
  className?: string;
}) {
  // Only show for pending status
  if (shipment.status !== 'pending') {
    return null;
  }

  const daysRemaining = getDaysUntilShippingDeadline(shipment.created_at, category);
  const isOverdue = isShippingOverdue(shipment.created_at, category, shipment.status);

  if (isOverdue) {
    return (
      <Badge className={`bg-red-500/20 text-red-400 border-red-500/30 ${className}`}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Overdue
      </Badge>
    );
  }

  if (daysRemaining <= 1) {
    return (
      <Badge className={`bg-red-500/20 text-red-400 border-red-500/30 animate-pulse ${className}`}>
        <Clock className="h-3 w-3 mr-1" />
        Ship today
      </Badge>
    );
  }

  if (daysRemaining <= 2) {
    return (
      <Badge className={`bg-amber-500/20 text-amber-400 border-amber-500/30 ${className}`}>
        <Clock className="h-3 w-3 mr-1" />
        {daysRemaining}d left
      </Badge>
    );
  }

  return (
    <Badge className={`bg-blue-500/20 text-blue-400 border-blue-500/30 ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      {daysRemaining}d to ship
    </Badge>
  );
}
