import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { EscrowToggle } from './EscrowToggle';
import { escrowManager } from '../lib/escrow-core';
import { calculateEscrowFee, type Chain, type SubscriptionTier } from '../lib/fee-engine';

interface EscrowCheckoutProps {
  assetId: string;
  assetTitle: string;
  assetPrice: number;
  sellerAddress: string;
  buyerAddress: string;
  onComplete: (escrowId?: string) => void;
  className?: string;
}

export function EscrowCheckout({
  assetId,
  assetTitle,
  assetPrice,
  sellerAddress,
  buyerAddress,
  onComplete,
  className = ''
}: EscrowCheckoutProps) {
  const [useEscrow, setUseEscrow] = useState(false);
  const [chain, setChain] = useState<Chain>('xrpl');
  const [subscription] = useState<SubscriptionTier>('basic'); // Would come from user profile
  const [escrowSettings, setEscrowSettings] = useState({
    expirationDays: 14,
    requiresBothParties: true,
    inspectionPeriodDays: 7,
    customConditions: ''
  });
  const [loading, setLoading] = useState(false);
  const [escrowFeeDetails, setEscrowFeeDetails] = useState<any>(null);

  const handleEscrowToggle = (enabled: boolean, feeDetails?: any) => {
    setUseEscrow(enabled);
    setEscrowFeeDetails(feeDetails);
  };

  const handleCreateEscrow = async () => {
    if (!useEscrow) {
      onComplete();
      return;
    }

    setLoading(true);
    try {
      const escrow = await escrowManager.createEscrow({
        chain,
        amountUSD: assetPrice,
        assetAmount: '1', // For NFTs/unique assets
        assetSymbol: 'LUXURY_ASSET',
        buyerAddress,
        sellerAddress,
        expirationDays: escrowSettings.expirationDays,
        conditions: [
          {
            type: 'delivery_confirmation',
            description: 'Buyer confirms receipt and authenticity of asset'
          },
          ...(escrowSettings.inspectionPeriodDays > 0 ? [{
            type: 'inspection_period' as const,
            description: `${escrowSettings.inspectionPeriodDays}-day inspection period`
          }] : []),
          ...(escrowSettings.customConditions ? [{
            type: 'custom' as const,
            description: escrowSettings.customConditions
          }] : [])
        ],
        metadata: {
          assetTokenId: assetId,
          deliveryMethod: 'physical_delivery',
          inspectionPeriodDays: escrowSettings.inspectionPeriodDays,
          requiresBothParties: escrowSettings.requiresBothParties,
          autoReleaseEnabled: true
        }
      });

      // In a real implementation, this would trigger blockchain transaction
      await escrowManager.lockFunds(escrow.escrowId);

      onComplete(escrow.escrowId);
    } catch (error) {
      console.error('Failed to create escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = useEscrow ? assetPrice + (escrowFeeDetails?.feeUSD || 0) : assetPrice;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Asset Summary */}
      <Card style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Purchase Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--ivory)' }}>{assetTitle}</span>
            <span className="font-bold" style={{ color: 'var(--gold)' }}>
              ${assetPrice.toLocaleString()}
            </span>
          </div>
          
          {useEscrow && escrowFeeDetails && (
            <div className="flex justify-between items-center text-sm">
              <span style={{ color: 'var(--ivory)' }}>LuxGuard Escrow Fee</span>
              <span style={{ color: 'var(--ivory)' }}>
                ${escrowFeeDetails.feeUSD.toLocaleString()}
              </span>
            </div>
          )}
          
          <hr style={{ borderColor: 'var(--graphite)' }} />
          
          <div className="flex justify-between items-center font-bold">
            <span style={{ color: 'var(--ivory)' }}>Total Amount</span>
            <span className="text-lg" style={{ color: 'var(--gold)' }}>
              ${totalAmount.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Escrow Toggle */}
      <EscrowToggle
        amountUSD={assetPrice}
        chain={chain}
        subscription={subscription}
        onToggle={handleEscrowToggle}
      />

      {/* Escrow Settings */}
      {useEscrow && (
        <Card style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
              Escrow Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chain Selection */}
            <div>
              <Label htmlFor="chain" style={{ color: 'var(--ivory)' }}>Blockchain</Label>
              <Select value={chain} onValueChange={(value: Chain) => setChain(value)}>
                <SelectTrigger style={{ 
                  backgroundColor: 'var(--graphite)', 
                  borderColor: 'var(--gold)',
                  color: 'var(--ivory)'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xrpl">XRP Ledger</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="solana" disabled>Solana (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration Period */}
            <div>
              <Label htmlFor="expiration" style={{ color: 'var(--ivory)' }}>
                Escrow Expiration (Days)
              </Label>
              <Input
                id="expiration"
                type="number"
                value={escrowSettings.expirationDays}
                onChange={(e) => setEscrowSettings(prev => ({
                  ...prev,
                  expirationDays: parseInt(e.target.value) || 14
                }))}
                min="1"
                max="90"
                style={{ 
                  backgroundColor: 'var(--graphite)', 
                  borderColor: 'var(--gold)',
                  color: 'var(--ivory)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
                Maximum time before escrow auto-cancels and refunds buyer
              </p>
            </div>

            {/* Inspection Period */}
            <div>
              <Label htmlFor="inspection" style={{ color: 'var(--ivory)' }}>
                Inspection Period (Days)
              </Label>
              <Input
                id="inspection"
                type="number"
                value={escrowSettings.inspectionPeriodDays}
                onChange={(e) => setEscrowSettings(prev => ({
                  ...prev,
                  inspectionPeriodDays: parseInt(e.target.value) || 0
                }))}
                min="0"
                max="30"
                style={{ 
                  backgroundColor: 'var(--graphite)', 
                  borderColor: 'var(--gold)',
                  color: 'var(--ivory)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
                Time allowed for asset inspection before final confirmation
              </p>
            </div>

            {/* Custom Conditions */}
            <div>
              <Label htmlFor="conditions" style={{ color: 'var(--ivory)' }}>
                Additional Conditions (Optional)
              </Label>
              <Textarea
                id="conditions"
                placeholder="e.g., Professional authentication required, specific delivery instructions..."
                value={escrowSettings.customConditions}
                onChange={(e) => setEscrowSettings(prev => ({
                  ...prev,
                  customConditions: e.target.value
                }))}
                style={{ 
                  backgroundColor: 'var(--graphite)', 
                  borderColor: 'var(--gold)',
                  color: 'var(--ivory)'
                }}
              />
            </div>

            {/* Dual Confirmation */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dualConfirm"
                checked={escrowSettings.requiresBothParties}
                onCheckedChange={(checked) => setEscrowSettings(prev => ({
                  ...prev,
                  requiresBothParties: checked as boolean
                }))}
              />
              <Label htmlFor="dualConfirm" className="text-sm" style={{ color: 'var(--ivory)' }}>
                Require confirmation from both buyer and seller
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card style={{ backgroundColor: 'var(--charcoal)', borderColor: useEscrow ? 'var(--gold)' : 'var(--graphite)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            {useEscrow ? (
              <CheckCircle className="w-5 h-5 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 text-yellow-500" />
            )}
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--ivory)' }}>
                {useEscrow ? 'Protected Transaction' : 'Standard Transaction'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ivory)', opacity: 0.8 }}>
                {useEscrow 
                  ? 'Your funds are secured by smart contract escrow with dispute resolution.'
                  : 'This is a direct transaction without escrow protection. Consider enabling escrow for high-value purchases.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onComplete()}
          style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 btn-gold"
          onClick={handleCreateEscrow}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {useEscrow ? <Shield className="w-4 h-4 mr-2" /> : null}
              {useEscrow ? 'Create Escrow & Pay' : 'Complete Purchase'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
