import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fiatOnrampService, OnrampProvider } from '@/lib/fiat-onramp';
import { useWallet } from '@/hooks/use-wallet';
import { CreditCard, Zap, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FiatOnrampWidgetProps {
  defaultAmount?: number;
  defaultCurrency?: string;
}

export const FiatOnrampWidget = ({ defaultAmount = 100, defaultCurrency = 'USD' }: FiatOnrampWidgetProps) => {
  const { t } = useTranslation();
  const { walletAddress, isConnected } = useWallet();
  const [amount, setAmount] = useState(defaultAmount);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [providers, setProviders] = useState<OnrampProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<OnrampProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeOnramp();
  }, []);

  useEffect(() => {
    if (providers.length > 0) {
      const bestProvider = fiatOnrampService.getBestProvider(amount, currency);
      setSelectedProvider(bestProvider);
    }
  }, [amount, currency, providers]);

  const initializeOnramp = async () => {
    try {
      await fiatOnrampService.initialize();
      const availableProviders = fiatOnrampService.getAvailableProviders();
      setProviders(availableProviders);
    } catch (error) {
      console.error('Failed to initialize onramp:', error);
      toast.error('Failed to load payment providers');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedProvider) {
      toast.error('No payment provider available');
      return;
    }

    try {
      await fiatOnrampService.launchProvider(selectedProvider.id, {
        userAddress: walletAddress,
        amount,
        currency
      });
      
      toast.success('Payment provider launched');
    } catch (error) {
      console.error('Failed to launch provider:', error);
      toast.error('Failed to launch payment provider');
    }
  };

  const calculateTotal = (provider: OnrampProvider) => {
    return fiatOnrampService.calculateTotalCost(amount, provider);
  };

  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Buy XRP with Fiat
        </CardTitle>
        <CardDescription>
          Purchase XRP directly to your wallet using credit card or bank transfer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
              min="1"
            />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Provider Selection */}
        {providers.length > 0 && (
          <div className="space-y-4">
            <label className="text-sm font-medium">Payment Provider</label>
            <div className="space-y-3">
              {providers.map((provider) => {
                const isSelected = selectedProvider?.id === provider.id;
                const total = calculateTotal(provider);
                const isInRange = amount >= provider.minAmount && amount <= provider.maxAmount;

                return (
                  <div
                    key={provider.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    } ${!isInRange ? 'opacity-50' : ''}`}
                    onClick={() => isInRange && setSelectedProvider(provider)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs font-bold">{provider.name[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {provider.processingTime}
                            {provider.kycRequired && (
                              <>
                                <Shield className="h-3 w-3" />
                                KYC Required
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(total, currency)}</div>
                        <div className="text-sm text-muted-foreground">
                          Fee: {provider.fees.percentage}%
                          {provider.fees.fixed > 0 && ` + ${formatCurrency(provider.fees.fixed, currency)}`}
                        </div>
                      </div>
                    </div>
                    
                    {!isInRange && (
                      <div className="mt-2 text-xs text-red-500">
                        Amount must be between {formatCurrency(provider.minAmount, currency)} and {formatCurrency(provider.maxAmount, currency)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {providers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment providers available in your region</p>
          </div>
        )}

        {/* Purchase Summary */}
        {selectedProvider && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{formatCurrency(amount, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fee:</span>
                <span>{formatCurrency(calculateTotal(selectedProvider) - amount, currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal(selectedProvider), currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>You'll receive:</span>
                <span>~{(amount * 2).toFixed(2)} XRP</span>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={!isConnected || !selectedProvider || providers.length === 0}
          className="w-full"
          size="lg"
        >
          {!isConnected ? (
            'Connect Wallet'
          ) : !selectedProvider ? (
            'Select Provider'
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Buy XRP with {selectedProvider.name}
            </>
          )}
        </Button>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• XRP will be sent directly to your connected wallet</p>
          <p>• Processing times vary by provider and payment method</p>
          <p>• Additional verification may be required for large amounts</p>
        </div>
      </CardContent>
    </Card>
  );
};
