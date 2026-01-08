/**
 * LuxGuard Escrow Creation Page
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useEscrowAuth } from '@/hooks/use-escrow-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, CheckCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { calculateEscrowFee, convertUSDToChainCurrency } from '@/lib/escrow.config';

interface EscrowFormData {
  assetName: string;
  amountUSD: number;
  buyerAddress: string;
  sellerAddress: string;
  chain: string;
  expirationDays: number;
  conditions: string;
}

export default function Escrow() {
  const { isAuthenticated, getAuthHeaders } = useEscrowAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escrowResult, setEscrowResult] = useState<any>(null);
  const [formData, setFormData] = useState<EscrowFormData>({
    assetName: '',
    amountUSD: 0,
    buyerAddress: '',
    sellerAddress: '',
    chain: 'xrpl',
    expirationDays: 7,
    conditions: 'Asset delivery confirmed and condition verified'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof EscrowFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateFees = () => {
    if (formData.amountUSD <= 0) return null;
    try {
      const feeDetails = calculateEscrowFee(formData.amountUSD, formData.chain);
      const chainAmount = convertUSDToChainCurrency(formData.amountUSD, formData.chain);
      return { ...feeDetails, chainAmount };
    } catch (error) {
      return null;
    }
  };

  const handleCreateEscrow = async () => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet and sign in to create an escrow');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/.netlify/functions/escrow-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          amountUSD: formData.amountUSD,
          buyerAddress: formData.buyerAddress,
          sellerAddress: formData.sellerAddress,
          assetTitle: formData.assetName,
          expirationDays: formData.expirationDays,
          conditions: [formData.conditions]
        })
      });

      const result = await response.json();
      if (result.success) {
        setEscrowResult(result);
        setCurrentStep(4);
        toast.success('Escrow created successfully!');
      } else {
        toast.error(result.error || 'Failed to create escrow');
      }
    } catch (error) {
      toast.error('Failed to create escrow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feeDetails = calculateFees();

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                LUXGUARD ESCROW
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Secure, dispute-resilient transfers for high-value assets
              </p>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Protection</p>
                <p className="text-sm font-medium" style={{ color: '#F5F5F7' }}>Blockchain Escrow</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Network</p>
                <p className="text-sm font-medium" style={{ color: '#F5F5F7' }}>XRPL</p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <Shield className="w-4 h-4" style={{ color: '#22C55E' }} />
              <span className="text-sm" style={{ color: '#22C55E' }}>Secured</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">

          {currentStep === 1 && (
            <Card style={{ background: 'var(--lux-dark-gray)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--ivory)' }}>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ivory)' }}>Asset Name *</Label>
                    <Input
                      placeholder="e.g., Vintage Rolex Submariner"
                      value={formData.assetName}
                      onChange={(e) => handleInputChange('assetName', e.target.value)}
                      style={{ background: 'var(--lux-black)', borderColor: 'rgba(212, 175, 55, 0.3)', color: 'var(--ivory)' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ivory)' }}>Amount (USD) *</Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={formData.amountUSD || ''}
                      onChange={(e) => handleInputChange('amountUSD', parseFloat(e.target.value) || 0)}
                      style={{ background: 'var(--lux-black)', borderColor: 'rgba(212, 175, 55, 0.3)', color: 'var(--ivory)' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ivory)' }}>Buyer Address *</Label>
                    <Input
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={formData.buyerAddress}
                      onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
                      style={{ background: 'var(--lux-black)', borderColor: 'rgba(212, 175, 55, 0.3)', color: 'var(--ivory)' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ivory)' }}>Seller Address *</Label>
                    <Input
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={formData.sellerAddress}
                      onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                      style={{ background: 'var(--lux-black)', borderColor: 'rgba(212, 175, 55, 0.3)', color: 'var(--ivory)' }}
                    />
                  </div>
                </div>

                {feeDetails && (
                  <div className="p-6 rounded-xl border" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--lux-gold)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--ivory)' }}>Fee Calculation</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="opacity-70" style={{ color: 'var(--ivory)' }}>Tier</div>
                        <div className="font-semibold" style={{ color: 'var(--lux-gold)' }}>
                          {feeDetails.tier} ({(feeDetails.feeRate * 100).toFixed(1)}%)
                        </div>
                      </div>
                      <div>
                        <div className="opacity-70" style={{ color: 'var(--ivory)' }}>Escrow Fee</div>
                        <div className="font-semibold" style={{ color: 'var(--lux-gold)' }}>
                          ${feeDetails.feeUSD}
                        </div>
                      </div>
                      <div>
                        <div className="opacity-70" style={{ color: 'var(--ivory)' }}>Chain Amount</div>
                        <div className="font-semibold" style={{ color: 'var(--lux-gold)' }}>
                          {feeDetails.chainAmount.amount.toFixed(6)} {feeDetails.chainAmount.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.assetName || !formData.buyerAddress || !formData.sellerAddress || formData.amountUSD <= 0}
                  className="w-full py-6 text-lg font-semibold"
                  style={{ background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)', color: 'var(--lux-black)' }}
                >
                  Preview Escrow Contract
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && feeDetails && (
            <Card style={{ background: 'var(--lux-dark-gray)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--ivory)' }}>Contract Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="opacity-70" style={{ color: 'var(--ivory)' }}>Asset</span>
                      <span className="font-semibold" style={{ color: 'var(--ivory)' }}>{formData.assetName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70" style={{ color: 'var(--ivory)' }}>Amount</span>
                      <span className="font-semibold" style={{ color: 'var(--lux-gold)' }}>${formData.amountUSD.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70" style={{ color: 'var(--ivory)' }}>Escrow Fee</span>
                      <span className="font-semibold" style={{ color: 'var(--lux-gold)' }}>${feeDetails.feeUSD}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--lux-gold)' }} />
                      <span className="text-sm" style={{ color: 'var(--ivory)' }}>XRPL Native Escrow</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--lux-gold)' }} />
                      <span className="text-sm" style={{ color: 'var(--ivory)' }}>Dispute Resolution</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1" style={{ borderColor: 'var(--lux-gold)', color: 'var(--lux-gold)' }}>
                    ← Edit Details
                  </Button>
                  <Button onClick={handleCreateEscrow} disabled={isSubmitting} className="flex-1" style={{ background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)', color: 'var(--lux-black)' }}>
                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating...</> : 'Create Escrow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && escrowResult && (
            <Card style={{ background: 'var(--lux-dark-gray)', border: '2px solid var(--lux-gold)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ color: 'var(--ivory)' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />
                  Escrow Contract Created
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ivory)' }}>Your funds are now secured!</h3>
                  <p style={{ color: 'var(--ivory)', opacity: 0.8 }}>
                    The escrow contract has been created on XRPL. Funds will be released once conditions are met.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-70" style={{ color: 'var(--ivory)' }}>Escrow ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ color: 'var(--lux-gold)' }}>{escrowResult.escrowId?.slice(0, 8)}...</span>
                      <button onClick={() => navigator.clipboard.writeText(escrowResult.escrowId)}>
                        <Copy className="w-4 h-4" style={{ color: 'var(--lux-gold)' }} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link to="/escrow/dashboard" className="flex-1">
                    <Button className="w-full gap-2" style={{ background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)', color: 'var(--lux-black)' }}>
                      View Escrow Dashboard
                    </Button>
                  </Link>
                  <Button onClick={() => window.open(escrowResult.explorerUrl, '_blank')} variant="outline" className="flex-1 gap-2" style={{ borderColor: 'var(--lux-gold)', color: 'var(--lux-gold)' }}>
                    <ExternalLink className="w-4 h-4" />
                    XRPL Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
