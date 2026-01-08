/**
 * Buyer Confirmation Component
 * 
 * Guides buyers through confirming receipt within the dispute window.
 * 
 * Key UX:
 * - Shows dispute window countdown
 * - Checklist before confirmation
 * - Clear consequences of confirming
 * - Easy path to report issues
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Shield,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Shipment,
  ItemCategory,
  getHoursRemainingInDisputeWindow,
  TRUST_COPY,
} from '../types';
import { shipmentService } from '../shipping-service';

interface BuyerConfirmationProps {
  shipment: Shipment;
  category: ItemCategory;
  itemValue: number;
  sellerName?: string;
  onConfirmed: (shipment: Shipment) => void;
  onDispute: () => void;
  className?: string;
}

export function BuyerConfirmation({
  shipment,
  category,
  itemValue,
  sellerName = 'the seller',
  onConfirmed,
  onDispute,
  className = '',
}: BuyerConfirmationProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    receivedItem: false,
    matchesDescription: false,
    conditionAcceptable: false,
  });

  // Only show for delivered status
  if (shipment.status !== 'delivered') {
    return null;
  }

  const hoursRemaining = shipment.delivered_at 
    ? getHoursRemainingInDisputeWindow(new Date(shipment.delivered_at), category)
    : 0;

  const allChecked = Object.values(checklist).every(Boolean);

  const handleChecklistChange = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const updated = await shipmentService.confirmReceipt(shipment.id);
      toast.success('Receipt confirmed! Funds will be released to the seller.');
      onConfirmed(updated);
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
      toast.error('Failed to confirm receipt. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleDispute = () => {
    setShowDisputeDialog(false);
    onDispute();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={`border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-neutral-900/80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-400" />
            Package Delivered
          </CardTitle>
          <div className="flex items-center gap-1 text-amber-400">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{hoursRemaining}h remaining</span>
          </div>
        </div>
        <CardDescription>
          Inspect your item and confirm receipt or report any issues.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dispute Window Notice */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-300">
                {hoursRemaining} Hours to Inspect
              </p>
              <p className="text-sm text-blue-300/80 mt-1">
                {TRUST_COPY.DISPUTE_WINDOW.replace('{hours}', hoursRemaining.toString())}
              </p>
            </div>
          </div>
        </div>

        {/* Escrow Protection Notice */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-300">Funds Protected</p>
              <p className="text-sm text-emerald-300/80 mt-1">
                {formatCurrency(itemValue)} {TRUST_COPY.ESCROW_PROTECTED}
              </p>
            </div>
          </div>
        </div>

        {/* Inspection Checklist */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Before confirming, please verify:
          </p>
          
          {[
            { key: 'receivedItem', label: 'I have physically received the item' },
            { key: 'matchesDescription', label: 'The item matches the listing description' },
            { key: 'conditionAcceptable', label: 'The condition is acceptable' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-3">
              <Checkbox
                id={key}
                checked={checklist[key as keyof typeof checklist]}
                onCheckedChange={() => handleChecklistChange(key as keyof typeof checklist)}
              />
              <Label htmlFor={key} className="text-sm cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!allChecked}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Confirm Receipt
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDisputeDialog(true)}
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>

        {!allChecked && (
          <p className="text-xs text-muted-foreground text-center">
            Complete the checklist above to confirm receipt.
          </p>
        )}

        {/* Confirm Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="border border-white/10 bg-neutral-950">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Confirm Receipt
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>By confirming, you acknowledge that:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>You have received the item</li>
                  <li>The item matches the description</li>
                  <li>You are satisfied with the condition</li>
                </ul>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mt-3">
                  <p className="text-amber-300 text-sm">
                    <strong>Important:</strong> Once confirmed, {formatCurrency(itemValue)} will 
                    be released to {sellerName}. This action cannot be undone.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Yes, Confirm Receipt
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dispute Dialog */}
        <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
          <AlertDialogContent className="border border-white/10 bg-neutral-950">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Report an Issue
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>Common reasons to report an issue:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Item not as described</li>
                  <li>Item damaged during shipping</li>
                  <li>Item appears counterfeit</li>
                  <li>Missing parts or accessories</li>
                  <li>Wrong item received</li>
                </ul>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 mt-3">
                  <p className="text-emerald-300 text-sm">
                    <Shield className="h-4 w-4 inline mr-1" />
                    {TRUST_COPY.DISPUTE_PROTECTION}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={handleDispute}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                <FileText className="h-4 w-4 mr-2" />
                Open Dispute
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
