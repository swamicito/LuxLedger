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
    <Card className={`${className}`} style={{ backgroundColor: '#0F0F11', border: '1px solid rgba(212, 175, 55, 0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <CardHeader className="pb-4 pt-5 px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.08)' }}>
              <Shield className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold" style={{ color: '#D4AF37' }}>
                LuxGuard Escrow Protection
              </CardTitle>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9CA3AF' }}>
                Secure your high-value transaction with decentralized escrow
              </p>
            </div>
          </div>
          <div className="pl-4">
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-amber-500 scale-110"
            />
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4 px-5 pb-5">
          {/* Fee Breakdown */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#0B0B0C', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>Escrow Fee</span>
              <span className="text-base font-semibold" style={{ color: '#D4AF37' }}>
                ${feeDetails.feeUSD.toLocaleString()}
              </span>
            </div>
            <div className="text-xs space-y-1.5" style={{ color: '#6B7280' }}>
              <div className="flex justify-between">
                <span>Base Rate:</span>
                <span>{(feeDetails.originalRate * 100).toFixed(2)}%</span>
              </div>
              {feeDetails.discountApplied > 0 && (
                <div className="flex justify-between" style={{ color: '#D4AF37' }}>
                  <span>Discount Applied:</span>
                  <span>-{feeDetails.discountApplied}%</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
                <span>Final Rate:</span>
                <span>{(feeDetails.feeRate * 100).toFixed(2)}%</span>
              </div>
              {feeDetails.flatCapApplied && (
                <div className="text-[10px] mt-2" style={{ color: '#6B7280' }}>
                  * Flat cap applied for high-value transaction
                </div>
              )}
            </div>
          </div>

          {/* Features - quieter */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>14-day protection</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Dispute resolution</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Smart contract</span>
            </div>
          </div>

          {/* Notes */}
          {feeDetails.notes.length > 0 && (
            <div className="flex items-start space-x-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <Info className="w-3.5 h-3.5 mt-0.5" style={{ color: '#6B7280' }} />
              <div className="text-[11px] space-y-1" style={{ color: '#6B7280' }}>
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
