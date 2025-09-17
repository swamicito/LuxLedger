import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info, Clock, Users } from 'lucide-react';
import { calculateEscrowFee, type Chain, type SubscriptionTier } from '../lib/fee-engine';

interface EscrowToggleProps {
  amountUSD: number;
  chain?: Chain;
  subscription?: SubscriptionTier;
  onToggle: (enabled: boolean, feeDetails?: any) => void;
  className?: string;
}

export function EscrowToggle({ 
  amountUSD, 
  chain = 'xrpl', 
  subscription = 'basic',
  onToggle, 
  className = '' 
}: EscrowToggleProps) {
  const [enabled, setEnabled] = useState(false);
  
  const feeDetails = calculateEscrowFee({ amountUSD, chain, subscription });

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onToggle(checked, checked ? feeDetails : null);
  };

  return (
    <Card className={`${className}`} style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" style={{ color: 'var(--gold)' }} />
            <div>
              <CardTitle className="text-lg" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                LuxGuard Escrow Protection
              </CardTitle>
              <p className="text-sm mt-1" style={{ color: 'var(--ivory)' }}>
                Secure your high-value transaction with decentralized escrow
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-gold"
          />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Fee Breakdown */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--lux-black)' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium" style={{ color: 'var(--ivory)' }}>Escrow Fee</span>
              <span className="text-lg font-bold" style={{ color: 'var(--gold)' }}>
                ${feeDetails.feeUSD.toLocaleString()}
              </span>
            </div>
            <div className="text-sm space-y-1" style={{ color: 'var(--ivory)' }}>
              <div className="flex justify-between">
                <span>Base Rate:</span>
                <span>{(feeDetails.originalRate * 100).toFixed(2)}%</span>
              </div>
              {feeDetails.discountApplied > 0 && (
                <div className="flex justify-between" style={{ color: 'var(--gold)' }}>
                  <span>Discount Applied:</span>
                  <span>-{feeDetails.discountApplied}%</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Final Rate:</span>
                <span>{(feeDetails.feeRate * 100).toFixed(2)}%</span>
              </div>
              {feeDetails.flatCapApplied && (
                <div className="text-xs mt-2" style={{ color: 'var(--gold)' }}>
                  * Flat cap applied for high-value transaction
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              <span className="text-sm" style={{ color: 'var(--ivory)' }}>14-day protection</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              <span className="text-sm" style={{ color: 'var(--ivory)' }}>Dispute resolution</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              <span className="text-sm" style={{ color: 'var(--ivory)' }}>Smart contract secured</span>
            </div>
          </div>

          {/* Notes */}
          {feeDetails.notes.length > 0 && (
            <div className="flex items-start space-x-2 p-3 rounded" style={{ backgroundColor: 'var(--graphite)' }}>
              <Info className="w-4 h-4 mt-0.5" style={{ color: 'var(--gold)' }} />
              <div className="text-xs space-y-1" style={{ color: 'var(--ivory)' }}>
                {feeDetails.notes.map((note, index) => (
                  <div key={index}>• {note}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
