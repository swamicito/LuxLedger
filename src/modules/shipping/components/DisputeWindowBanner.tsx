/**
 * Dispute Window Banner
 * 
 * Shows the countdown for the dispute window after delivery.
 * Displayed to buyers to remind them to inspect and confirm.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  AlertTriangle,
  Shield,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

import {
  Shipment,
  ItemCategory,
  getHoursRemainingInDisputeWindow,
  getDisputeWindowEnd,
  CATEGORY_REQUIREMENTS,
  TRUST_COPY,
} from '../types';

interface DisputeWindowBannerProps {
  shipment: Shipment;
  category: ItemCategory;
  onConfirm: () => void;
  onDispute: () => void;
  className?: string;
}

export function DisputeWindowBanner({
  shipment,
  category,
  onConfirm,
  onDispute,
  className = '',
}: DisputeWindowBannerProps) {
  const [hoursRemaining, setHoursRemaining] = useState(0);

  useEffect(() => {
    if (!shipment.delivered_at) return;

    const updateRemaining = () => {
      const hours = getHoursRemainingInDisputeWindow(
        new Date(shipment.delivered_at!),
        category
      );
      setHoursRemaining(hours);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [shipment.delivered_at, category]);

  // Only show for delivered status
  if (shipment.status !== 'delivered' || !shipment.delivered_at) {
    return null;
  }

  const requirements = CATEGORY_REQUIREMENTS[category];
  const totalWindowHours = requirements.disputeWindowHours;
  const progressPercent = Math.max(0, Math.min(100, 
    ((totalWindowHours - hoursRemaining) / totalWindowHours) * 100
  ));

  const isUrgent = hoursRemaining <= 12;
  const isExpiring = hoursRemaining <= 24;

  const formatTimeRemaining = () => {
    if (hoursRemaining >= 24) {
      const days = Math.floor(hoursRemaining / 24);
      const hours = hoursRemaining % 24;
      return `${days}d ${hours}h`;
    }
    return `${hoursRemaining}h`;
  };

  return (
    <Card className={`border ${
      isUrgent 
        ? 'border-red-500/30 bg-red-500/5' 
        : isExpiring 
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-blue-500/30 bg-blue-500/5'
    } ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${
            isUrgent 
              ? 'bg-red-500/20 text-red-400' 
              : isExpiring 
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={`font-semibold ${
                isUrgent 
                  ? 'text-red-400' 
                  : isExpiring 
                    ? 'text-amber-400'
                    : 'text-blue-400'
              }`}>
                {isUrgent ? 'Confirm Soon' : 'Inspection Window'}
              </h4>
              {isUrgent && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                  Expiring Soon
                </Badge>
              )}
            </div>

            {/* Time remaining */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                isUrgent 
                  ? 'text-red-400' 
                  : isExpiring 
                    ? 'text-amber-400'
                    : 'text-blue-400'
              }`}>
                {formatTimeRemaining()}
              </span>
              <span className="text-sm text-muted-foreground">
                remaining to inspect
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <Progress 
                value={progressPercent} 
                className={`h-1.5 ${
                  isUrgent 
                    ? 'bg-red-500/20' 
                    : isExpiring 
                      ? 'bg-amber-500/20'
                      : 'bg-blue-500/20'
                }`}
              />
            </div>

            {/* Trust message */}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-400" />
              {TRUST_COPY.ESCROW_PROTECTED}
            </p>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={onConfirm}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm Receipt
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDispute}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Report Issue
              </Button>
            </div>
          </div>
        </div>

        {/* Auto-release warning */}
        {isExpiring && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs text-amber-400/80">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              If you don't confirm or report an issue, funds will automatically release to the seller.
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
export function DisputeWindowInline({
  shipment,
  category,
  className = '',
}: {
  shipment: Shipment;
  category: ItemCategory;
  className?: string;
}) {
  if (shipment.status !== 'delivered' || !shipment.delivered_at) {
    return null;
  }

  const hoursRemaining = getHoursRemainingInDisputeWindow(
    new Date(shipment.delivered_at),
    category
  );

  const isUrgent = hoursRemaining <= 12;

  return (
    <Badge className={`${
      isUrgent 
        ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    } ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      {hoursRemaining}h to confirm
    </Badge>
  );
}
