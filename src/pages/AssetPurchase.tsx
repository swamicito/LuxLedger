/**
 * Asset Purchase Page with LuxGuard Escrow Integration
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { supabase } from '@/lib/supabase-client';
import { EscrowCheckout } from '../modules/escrow/components/EscrowCheckout';
import { EscrowToggle } from '../modules/escrow/components/EscrowToggle';
import { multichainAdapter } from '../modules/escrow/lib/multichain-adapter';
import { subscriptionManager } from '../modules/escrow/lib/subscription-model';
import { 
  ArrowLeft,
  Shield,
  Verified,
  Clock,
  MapPin,
  User,
  Eye,
  Heart,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { TrustBadge, TrustSignalsPanel } from '@/components/ui/trust-signals';
import { FeeBreakdown, DualPrice } from '@/components/ui/fee-breakdown';
import { EscapeHatches, ContextualHelp } from '@/components/ui/escape-hatches';

interface Asset {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_value: number;
  images: string[];
  status: string;
  created_at: string;
  owner_id: string;
  region: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  nft_tokens?: {
    token_id: string;
    contract_address: string;
  }[];
}

export default function AssetPurchase() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [useEscrow, setUseEscrow] = useState(true);
  const [selectedChain, setSelectedChain] = useState<'xrpl' | 'ethereum' | 'polygon'>('xrpl');
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'checkout' | 'processing' | 'complete'>('details');
  const [createdEscrowId, setCreatedEscrowId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAsset(id);
      trackEvent('asset_purchase_view', { asset_id: id });
    }
  }, [id]);

  const fetchAsset = async (assetId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, title, description, category, estimated_value, images, status, created_at, owner_id')
        .eq('id', assetId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setAsset(null);
        return;
      }

      const [{ data: sellerProfile }, { data: nftTokens }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, profile_image_url')
          .eq('user_id', data.owner_id)
          .maybeSingle(),
        supabase
          .from('nft_tokens')
          .select('token_id, contract_address')
          .eq('asset_id', data.id),
      ]);

      setAsset({
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        category: String(data.category),
        estimated_value: Number(data.estimated_value) || 0,
        images: data.images ?? [],
        status: data.status ?? 'listed',
        created_at: data.created_at,
        owner_id: data.owner_id,
        region: 'global',
        profiles: sellerProfile
          ? { full_name: sellerProfile.full_name ?? 'Anonymous', avatar_url: sellerProfile.profile_image_url ?? undefined }
          : undefined,
        nft_tokens: (nftTokens ?? []).map((t) => ({
          token_id: t.token_id ?? '',
          contract_address: t.contract_address ?? '',
        })),
      });
    } catch (error) {
      console.error('Error fetching asset:', error);
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!asset || !user) return;

    setPurchaseStep('processing');
    trackEvent('asset_purchase_initiated', { 
      asset_id: asset.id, 
      use_escrow: useEscrow,
      chain: selectedChain 
    });

    try {
      if (useEscrow) {
        // Resolve wallet addresses first: the seller must be able to receive
        // XRP, and the buyer's real address comes back from the Xaman signer.
        const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
          supabase
            .from('profiles')
            .select('wallet_address')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('wallet_address')
            .eq('user_id', asset.owner_id)
            .maybeSingle(),
        ]);

        const sellerWallet = sellerProfile?.wallet_address ?? '';
        if (!/^r[1-9A-HJ-NP-Za-km-z]{24,33}$/.test(sellerWallet)) {
          toast.error(
            'This seller cannot receive escrow payments yet — no XRPL wallet on file.',
            { duration: 8000 }
          );
          setPurchaseStep('details');
          return;
        }

        // Create the on-chain escrow on XRPL testnet. The buyer signs the
        // EscrowCreate in Xaman; this throws on any failure and nothing is
        // recorded in the database when it does.
        const escrowResult = await multichainAdapter.createEscrow({
          chain: 'xrpl',
          seller: sellerWallet,
          buyer: user.id,
          amount: asset.estimated_value.toString(),
          expirationDays: 7,
          metadata: asset.id,
        });

        // Track escrow usage for subscription analytics
        const userSub = subscriptionManager.getUserSubscription(user.id);
        if (userSub) {
          const discount = subscriptionManager.calculateEscrowDiscount(
            user.id, 
            asset.estimated_value, 
            userSub.monthlyVolumeUsed
          );
          await subscriptionManager.trackEscrowUsage(
            user.id, 
            asset.estimated_value, 
            discount.savings
          );
        }

        // Persist the escrow as the canonical row that drives the entire
        // post-transaction system — only after the EscrowCreate is validated
        // on-chain. Chain fields: tx hash, escrow sequence, real addresses.
        const nowIso = new Date().toISOString();
        const insertPayload = {
          buyer_id: user.id,
          seller_id: asset.owner_id,
          asset_id: asset.id,
          amount_usd: asset.estimated_value,
          amount_xrp: escrowResult.amountXrp ?? null,
          platform_fee_usd: Number((asset.estimated_value * 0.025).toFixed(2)),
          buyer_address:
            escrowResult.buyerAddress ?? buyerProfile?.wallet_address ?? `pending:${user.id}`,
          seller_address: sellerWallet,
          escrow_sequence: escrowResult.escrowSequence ?? null,
          escrow_create_tx_hash: escrowResult.txHash,
          status: 'funded',
          escrow_status: 'held',
          funded_at: nowIso,
          created_at: nowIso,
        };

        let escrowRow: { id: string } | null = null;
        let insertError: { code?: string; message?: string; details?: string; hint?: string } | null = null;

        const firstAttempt = await supabase
          .from('escrow_transactions')
          .insert(insertPayload)
          .select('id')
          .single();
        escrowRow = firstAttempt.data;
        insertError = firstAttempt.error;

        // If production hasn't added escrow_create_tx_hash yet, retry without
        // it so the purchase still records (the chain refs stay in the toast/log).
        if (
          insertError &&
          (insertError.code === '42703' || insertError.code === 'PGRST204' ||
            (insertError.message ?? '').includes('escrow_create_tx_hash'))
        ) {
          const { escrow_create_tx_hash: _dropped, ...payloadWithoutChainHash } = insertPayload;
          const retry = await supabase
            .from('escrow_transactions')
            .insert(payloadWithoutChainHash)
            .select('id')
            .single();
          escrowRow = retry.data;
          insertError = retry.error;
        }

        if (insertError || !escrowRow) {
          // eslint-disable-next-line no-console
          console.error('escrow_transactions insert failed', {
            code: insertError?.code,
            message: insertError?.message,
            details: insertError?.details,
            hint: insertError?.hint,
            payload: insertPayload,
          });
          toast.error(
            `On-chain escrow created (${escrowResult.txHash}) but we could not record it: ${
              insertError?.message ?? 'no row returned'
            }`,
            { duration: 12000 }
          );
          setPurchaseStep('details');
          return;
        }

        toast.success('Escrow created. Tracking your order…');
        setCreatedEscrowId(escrowRow.id);
        trackEvent('escrow_created', {
          escrow_id: escrowRow.id,
          chain_escrow_id: escrowResult.escrowId,
          chain_tx_hash: escrowResult.txHash,
          asset_id: asset.id,
        });
        setPurchaseStep('complete');
        navigate(`/order/${escrowRow.id}`);
        return;
      } else {
        // Direct purchase without escrow
        toast.success('Purchase completed!');
        trackEvent('direct_purchase_completed', { asset_id: asset.id });
      }

      setPurchaseStep('complete');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Purchase failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Purchase failed. Please try again.',
        { duration: 8000 }
      );
      setPurchaseStep('details');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--lux-black)' }}>
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-700 rounded-2xl"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-20 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--lux-black)' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--ivory)' }}>
            Asset Not Found
          </h2>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  if (purchaseStep === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--lux-black)' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: '#D4AF37' }}>
            <Shield className="w-10 h-10" style={{ color: 'var(--lux-black)' }} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}>
            {useEscrow ? 'Escrow Created!' : 'Purchase Complete!'}
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--ivory)', opacity: 0.8 }}>
            {useEscrow 
              ? "Funds remain in escrow until delivery is confirmed."
              : 'Your purchase has been completed successfully.'
            }
          </p>
          <div className="space-y-4">
            {useEscrow && createdEscrowId ? (
              <Button
                onClick={() => navigate(`/order/${createdEscrowId}`)}
                className="w-full bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#B68E2A]"
              >
                Track Your Order
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/portfolio')}
                className="w-full bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#B68E2A]"
              >
                View Portfolio
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate('/marketplace')}
              className="w-full"
              style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--lux-black)' }}>
      <div className="container mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/marketplace')}
          className="mb-8 gap-2"
          style={{ color: '#D4AF37' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Asset Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
              {asset.images && asset.images.length > 0 ? (
                <img 
                  src={asset.images[0]} 
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="w-16 h-16" style={{ color: '#D4AF37', opacity: 0.5 }} />
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 gap-2" style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
                <Heart className="w-4 h-4" />
                Save
              </Button>
              <Button variant="outline" className="flex-1 gap-2" style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Asset Details & Purchase */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">
                  {asset.nft_tokens?.length ? 'NFT' : asset.status}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Verified className="w-3 h-3" />
                  Verified
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}>
                {asset.title}
              </h1>
              
              <div className="mb-6">
                <DualPrice amountUSD={asset.estimated_value} size="lg" />
              </div>
            </div>

            {/* Asset Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" style={{ color: '#D4AF37' }} />
                <span style={{ color: 'var(--ivory)' }}>
                  Owned by <strong>{asset.profiles?.full_name || 'Anonymous'}</strong>
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" style={{ color: '#D4AF37' }} />
                <span style={{ color: 'var(--ivory)' }}>
                  {asset.region.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" style={{ color: '#D4AF37' }} />
                <span style={{ color: 'var(--ivory)' }}>
                  Listed {new Date(asset.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Separator style={{ background: 'rgba(212, 175, 55, 0.2)' }} />

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--ivory)' }}>
                Description
              </h3>
              <p style={{ color: 'var(--ivory)', opacity: 0.8, lineHeight: 1.6 }}>
                {asset.description}
              </p>
            </div>

            <Separator style={{ background: 'rgba(212, 175, 55, 0.2)' }} />

            {/* Escrow Option */}
            {purchaseStep === 'details' && (
              <div className="space-y-6">
                {/* Trust Signals */}
                <div className="space-y-3">
                  <TrustBadge variant="escrow" />
                  <TrustBadge variant="custody" />
                </div>

                <EscrowToggle
                  amountUSD={asset.estimated_value}
                  chain={selectedChain}
                  subscription="basic"
                  defaultEnabled
                  onToggle={(enabled) => setUseEscrow(enabled)}
                />

                {useEscrow && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                      Select Network
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(['xrpl', 'ethereum', 'polygon'] as const).map((chain) => {
                        const disabled = chain !== 'xrpl';
                        return (
                          <button
                            key={chain}
                            onClick={() => !disabled && setSelectedChain(chain)}
                            disabled={disabled}
                            className="py-3 px-3 rounded-lg transition-all duration-150"
                            style={{
                              background: selectedChain === chain ? 'rgba(212, 175, 55, 0.08)' : '#0B0B0C',
                              border: selectedChain === chain ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                              opacity: disabled ? 0.4 : 1,
                              cursor: disabled ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <div className="text-sm font-semibold" style={{ color: selectedChain === chain ? '#D4AF37' : '#F5F5F7' }}>
                              {chain === 'xrpl' ? 'XRPL' : chain.charAt(0).toUpperCase() + chain.slice(1)}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
                              {chain === 'xrpl' ? 'Xaman · Testnet' : 'Soon'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fee Breakdown */}
                <FeeBreakdown subtotalUSD={asset.estimated_value} />

                {/* Purchase Buttons */}
                <div className="space-y-4">
                  <Button
                    onClick={handlePurchase}
                    disabled={!user}
                    className="w-full py-6 text-lg font-semibold bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#B68E2A]"
                  >
                    {useEscrow ? 'Purchase with Escrow' : 'Buy Now'}
                  </Button>

                  {!user && (
                    <div className="flex items-center gap-2 p-4 rounded-lg" style={{ background: 'rgba(255, 165, 0, 0.1)' }}>
                      <AlertTriangle className="w-5 h-5" style={{ color: '#FFA500' }} />
                      <span style={{ color: '#FFA500' }}>
                        Please sign in to purchase this asset
                      </span>
                    </div>
                  )}
                </div>

                {/* Escape Hatches */}
                <EscapeHatches
                  onCancel={() => navigate('/marketplace')}
                  cancelLabel="Cancel and return"
                  helpContext="purchase"
                  showSave={false}
                />
              </div>
            )}

            {/* Checkout Component */}
            {purchaseStep === 'checkout' && (
              <EscrowCheckout
                assetId={asset.id}
                assetTitle={asset.title}
                assetPrice={asset.estimated_value}
                sellerAddress={asset.owner_id}
                buyerAddress={user?.id || ''}
                onComplete={() => setPurchaseStep('complete')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
