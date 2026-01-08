import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/hooks/use-wallet';
import { xrplClient } from '@/lib/xrpl-client';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Minus, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface DEXOffer {
  id: string;
  account: string;
  sequence: number;
  takerGets: {
    currency: string;
    issuer?: string;
    value: string;
  };
  takerPays: {
    currency: string;
    issuer?: string;
    value: string;
  };
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
  createdAt: Date;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  count: number;
}

interface TradingPair {
  base: string;
  quote: string;
  baseIssuer?: string;
  quoteIssuer?: string;
  lastPrice: number;
  change24h: number;
  volume24h: number;
}

const TRADING_PAIRS: TradingPair[] = [
  {
    base: 'XRP',
    quote: 'USD',
    quoteIssuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
    lastPrice: 0.52,
    change24h: 5.2,
    volume24h: 1250000
  },
  {
    base: 'LUXURY',
    quote: 'XRP',
    baseIssuer: 'rLUXURYTokenIssuerAddress123456789',
    lastPrice: 100.5,
    change24h: -2.1,
    volume24h: 45000
  },
  {
    base: 'REIT',
    quote: 'XRP',
    baseIssuer: 'rREITTokenIssuerAddress123456789',
    lastPrice: 250.75,
    change24h: 8.7,
    volume24h: 78000
  }
];

export const DEXTradingInterface = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress } = useWallet();
  const [selectedPair, setSelectedPair] = useState<TradingPair>(TRADING_PAIRS[0]);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }>({ bids: [], asks: [] });
  const [myOffers, setMyOffers] = useState<DEXOffer[]>([]);
  const [recentTrades, setRecentTrades] = useState<DEXOffer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && selectedPair) {
      fetchOrderBook();
      fetchMyOffers();
      fetchRecentTrades();
    }
  }, [isConnected, selectedPair]);

  const fetchOrderBook = async () => {
    try {
      // Mock order book data - in production, fetch from XRPL
      setOrderBook({
        bids: [
          { price: 0.519, amount: 10000, total: 5190, count: 3 },
          { price: 0.518, amount: 25000, total: 12950, count: 7 },
          { price: 0.517, amount: 15000, total: 7755, count: 2 },
          { price: 0.516, amount: 30000, total: 15480, count: 5 },
          { price: 0.515, amount: 20000, total: 10300, count: 4 }
        ],
        asks: [
          { price: 0.521, amount: 8000, total: 4168, count: 2 },
          { price: 0.522, amount: 18000, total: 9396, count: 4 },
          { price: 0.523, amount: 12000, total: 6276, count: 3 },
          { price: 0.524, amount: 22000, total: 11528, count: 6 },
          { price: 0.525, amount: 16000, total: 8400, count: 3 }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch order book:', error);
    }
  };

  const fetchMyOffers = async () => {
    if (!walletAddress) return;
    
    try {
      // Mock user offers - in production, fetch from XRPL
      setMyOffers([
        {
          id: 'offer1',
          account: walletAddress,
          sequence: 12345,
          takerGets: { currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', value: '520' },
          takerPays: { currency: 'XRP', value: '1000' },
          price: 0.52,
          amount: 1000,
          total: 520,
          type: 'sell',
          createdAt: new Date('2024-01-22T10:30:00Z')
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      // Mock recent trades - in production, fetch from XRPL
      setRecentTrades([
        {
          id: 'trade1',
          account: 'rTrader123...',
          sequence: 0,
          takerGets: { currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', value: '520' },
          takerPays: { currency: 'XRP', value: '1000' },
          price: 0.52,
          amount: 1000,
          total: 520,
          type: 'buy',
          createdAt: new Date('2024-01-22T11:45:00Z')
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch recent trades:', error);
    }
  };

  const handleCreateOffer = async () => {
    if (!isConnected || !price || !amount) {
      toast.error('Please fill in all fields and connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const priceNum = parseFloat(price);
      const amountNum = parseFloat(amount);

      const takerGets = orderType === 'buy' 
        ? { currency: selectedPair.base, issuer: selectedPair.baseIssuer, value: amountNum.toString() }
        : { currency: selectedPair.quote, issuer: selectedPair.quoteIssuer, value: (amountNum * priceNum).toString() };

      const takerPays = orderType === 'buy'
        ? { currency: selectedPair.quote, issuer: selectedPair.quoteIssuer, value: (amountNum * priceNum).toString() }
        : { currency: selectedPair.base, issuer: selectedPair.baseIssuer, value: amountNum.toString() };

      // In production, use actual XRPL client
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`${orderType === 'buy' ? 'Buy' : 'Sell'} offer created successfully`);
      
      // Reset form
      setPrice('');
      setAmount('');
      
      // Refresh data
      fetchMyOffers();
      fetchOrderBook();
    } catch (error) {
      console.error('Failed to create offer:', error);
      toast.error('Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    setLoading(true);
    try {
      // In production, cancel offer on XRPL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMyOffers(prev => prev.filter(offer => offer.id !== offerId));
      toast.success('Offer cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel offer:', error);
      toast.error('Failed to cancel offer');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(6);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString();
  };

  const getTotal = () => {
    const priceNum = parseFloat(price) || 0;
    const amountNum = parseFloat(amount) || 0;
    return (priceNum * amountNum).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Trading Pair Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              {t('trading.title')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchOrderBook();
                fetchMyOffers();
                fetchRecentTrades();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRADING_PAIRS.map((pair) => (
              <Card
                key={`${pair.base}-${pair.quote}`}
                className={`cursor-pointer transition-colors ${
                  selectedPair === pair ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPair(pair)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{pair.base}/{pair.quote}</span>
                    <Badge variant={pair.change24h >= 0 ? 'default' : 'destructive'}>
                      {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">{formatPrice(pair.lastPrice)}</div>
                  <div className="text-sm text-muted-foreground">
                    Vol: {formatAmount(pair.volume24h)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('trading.createOffer')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="text-green-600">Buy</TabsTrigger>
                <TabsTrigger value="sell" className="text-red-600">Sell</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price ({selectedPair.quote})</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.000000"
                step="0.000001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({selectedPair.base})</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total ({selectedPair.quote})</label>
              <div className="text-lg font-semibold p-2 bg-muted rounded">
                {getTotal()}
              </div>
            </div>

            <Button
              onClick={handleCreateOffer}
              disabled={loading || !isConnected || !price || !amount}
              className={`w-full ${orderType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Creating...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${selectedPair.base}`}
            </Button>
          </CardContent>
        </Card>

        {/* Order Book */}
        <Card>
          <CardHeader>
            <CardTitle>{t('trading.orderBook')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Asks (Sell Orders) */}
              <div>
                <div className="text-sm font-medium text-red-600 mb-2">Asks</div>
                <div className="space-y-1">
                  {orderBook.asks.slice().reverse().map((ask, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-sm py-1 hover:bg-red-50 cursor-pointer">
                      <span className="text-red-600 font-mono">{formatPrice(ask.price)}</span>
                      <span className="text-right font-mono">{formatAmount(ask.amount)}</span>
                      <span className="text-right font-mono text-muted-foreground">{ask.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spread */}
              <div className="text-center py-2 border-y">
                <span className="text-sm text-muted-foreground">
                  Spread: {((orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0)).toFixed(6)}
                </span>
              </div>

              {/* Bids (Buy Orders) */}
              <div>
                <div className="text-sm font-medium text-green-600 mb-2">Bids</div>
                <div className="space-y-1">
                  {orderBook.bids.map((bid, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-sm py-1 hover:bg-green-50 cursor-pointer">
                      <span className="text-green-600 font-mono">{formatPrice(bid.price)}</span>
                      <span className="text-right font-mono">{formatAmount(bid.amount)}</span>
                      <span className="text-right font-mono text-muted-foreground">{bid.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Orders & Recent Trades */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">My Orders</TabsTrigger>
                <TabsTrigger value="trades">Recent Trades</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="p-4 space-y-4">
                {myOffers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active orders
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOffers.map((offer) => (
                      <div key={offer.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={offer.type === 'buy' ? 'default' : 'destructive'}>
                            {offer.type.toUpperCase()}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOffer(offer.id)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Price:</span>
                            <span className="font-mono">{formatPrice(offer.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-mono">{formatAmount(offer.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-mono">{offer.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trades" className="p-4">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent trades
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between text-sm py-2 border-b">
                        <div className="flex items-center gap-2">
                          {trade.type === 'buy' ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className="font-mono">{formatPrice(trade.price)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{formatAmount(trade.amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {trade.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
