/**
 * Seller Shipping Form
 * 
 * The primary interface for sellers to add shipping information.
 * Seller selects from approved carriers, enters tracking, confirms insurance.
 * 
 * UX Copy: "Seller is responsible for insured shipping to your verified address."
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Package,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Shipment,
  ApprovedCarrier,
  ItemCategory,
  ProofDocument,
  APPROVED_CARRIERS,
  CATEGORY_REQUIREMENTS,
  getApprovedCarriersForCategory,
  TRUST_COPY,
} from '../types';
import { shipmentService } from '../shipping-service';
import { ShippingStatusBadge } from './ShippingStatusBadge';

interface SellerShippingFormProps {
  shipment: Shipment;
  category: ItemCategory;
  onShipmentUpdated: (shipment: Shipment) => void;
  className?: string;
}

export function SellerShippingForm({
  shipment,
  category,
  onShipmentUpdated,
  className = '',
}: SellerShippingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [carrier, setCarrier] = useState<ApprovedCarrier>('fedex');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [insuredValue, setInsuredValue] = useState(shipment.declared_value.toString());
  const [insuranceConfirmed, setInsuranceConfirmed] = useState(false);

  const requirements = CATEGORY_REQUIREMENTS[category];
  const approvedCarriers = getApprovedCarriersForCategory(category);
  const selectedCarrierInfo = APPROVED_CARRIERS[carrier];

  const isAlreadyShipped = shipment.status !== 'pending';

  const handleSubmit = async () => {
    // Validation
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    if (!insuranceConfirmed && requirements.requiresInsurance) {
      toast.error('Please confirm insurance coverage');
      return;
    }

    const insuredValueNum = parseFloat(insuredValue);
    if (isNaN(insuredValueNum) || insuredValueNum < shipment.declared_value * (requirements.minInsurancePercent / 100)) {
      toast.error(`Insurance must cover at least ${requirements.minInsurancePercent}% of item value`);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await shipmentService.addShippingInfo({
        shipmentId: shipment.id,
        carrier,
        carrierName: carrier === 'other' ? carrierName : undefined,
        trackingNumber: trackingNumber.trim(),
        insuredValue: insuredValueNum,
        insuranceConfirmed,
      });

      toast.success('Shipping information added successfully');
      onShipmentUpdated(updated);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to add shipping info:', error);
      toast.error('Failed to add shipping information');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already shipped - show status
  if (isAlreadyShipped) {
    return (
      <Card className={`border border-white/10 bg-neutral-950 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-400" />
              Shipping Information
            </CardTitle>
            <ShippingStatusBadge status={shipment.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Carrier</p>
              <p className="font-medium">{shipment.carrier_name || APPROVED_CARRIERS[shipment.carrier]?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tracking Number</p>
              <p className="font-mono text-sm">{shipment.tracking_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insured Value</p>
              <p className="font-medium">${shipment.insured_value.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shipped</p>
              <p className="font-medium">
                {shipment.shipped_at 
                  ? new Date(shipment.shipped_at).toLocaleDateString()
                  : 'Pending'
                }
              </p>
            </div>
          </div>

          {/* Proof documents */}
          {shipment.proof_documents.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted-foreground mb-2">Proof Documents</p>
              <div className="space-y-1">
                {shipment.proof_documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span>{doc.filename}</span>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pending - show form
  return (
    <Card className={`border border-amber-500/30 bg-amber-500/5 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-400" />
          Add Shipping Information
        </CardTitle>
        <CardDescription>
          {TRUST_COPY.SELLER_RESPONSIBLE}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black">
              <Package className="h-4 w-4 mr-2" />
              Enter Shipping Details
            </Button>
          </DialogTrigger>
          <DialogContent className="border border-white/10 bg-neutral-950 max-w-md">
            <DialogHeader>
              <DialogTitle>Shipping Information</DialogTitle>
              <DialogDescription>
                Select an approved carrier and enter your tracking number.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Carrier Selection */}
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Select value={carrier} onValueChange={(v) => setCarrier(v as ApprovedCarrier)}>
                  <SelectTrigger className="bg-black/40">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedCarriers.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other Carrier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Other carrier name */}
              {carrier === 'other' && (
                <div className="space-y-2">
                  <Label>Carrier Name</Label>
                  <Input
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="Enter carrier name"
                    className="bg-black/40"
                  />
                </div>
              )}

              {/* Tracking Number */}
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="Enter tracking number"
                  className="bg-black/40 font-mono"
                />
              </div>

              {/* Insured Value */}
              <div className="space-y-2">
                <Label>Insured Value (USD)</Label>
                <Input
                  type="number"
                  value={insuredValue}
                  onChange={(e) => setInsuredValue(e.target.value)}
                  placeholder="Enter insured value"
                  className="bg-black/40"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: ${(shipment.declared_value * requirements.minInsurancePercent / 100).toLocaleString()} 
                  ({requirements.minInsurancePercent}% of item value)
                </p>
              </div>

              {/* Insurance Confirmation */}
              <div className="flex items-start space-x-3 rounded-lg border border-white/10 bg-black/40 p-3">
                <Checkbox
                  id="insurance"
                  checked={insuranceConfirmed}
                  onCheckedChange={(checked) => setInsuranceConfirmed(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="insurance" className="cursor-pointer">
                    I confirm this shipment is insured
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    I have purchased shipping insurance covering the full declared value.
                  </p>
                </div>
              </div>

              {/* Category-specific notes */}
              {requirements.handlingNotes && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <p className="text-xs text-blue-300">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {requirements.handlingNotes}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !trackingNumber.trim() || !insuranceConfirmed}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Shipment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Handling notes reminder */}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Ship within {requirements.shippingSLADays} days to avoid cancellation
        </p>
      </CardContent>
    </Card>
  );
}
