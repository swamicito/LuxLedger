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
  const { account } = useWallet();
  const isConnected = !!account;
  const walletAddress = account?.address;
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
    <div className="space-y-4">
      {/* Trading Pair Selector - Minimal, data-first */}
      <div className="rounded-lg p-4" style={{ backgroundColor: '#121214', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Select Market</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchOrderBook();
              fetchMyOffers();
              fetchRecentTrades();
            }}
            className="text-gray-500 hover:text-white hover:bg-white/5 h-7 w-7 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TRADING_PAIRS.map((pair) => (
            <div
              key={`${pair.base}-${pair.quote}`}
              className={`cursor-pointer rounded-lg p-3 transition-all ${
                selectedPair === pair 
                  ? 'ring-1' 
                  : 'hover:bg-white/5'
              }`}
              style={{ 
                backgroundColor: selectedPair === pair ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: selectedPair === pair ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent'
              }}
              onClick={() => setSelectedPair(pair)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm" style={{ color: '#F5F5F7' }}>{pair.base}/{pair.quote}</span>
                <span 
                  className="text-xs font-medium"
                  style={{ color: pair.change24h >= 0 ? '#22C55E' : '#EF4444' }}
                >
                  {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(1)}%
                </span>
              </div>
              <div className="text-lg font-bold font-mono" style={{ color: '#F5F5F7' }}>{formatPrice(pair.lastPrice)}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Vol: {formatAmount(pair.volume24h)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Form - Clean, focused */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#121214', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Place Order</span>
          </div>
          
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
            <button
              onClick={() => setOrderType('buy')}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                orderType === 'buy' ? '' : 'text-gray-500 hover:text-white'
              }`}
              style={orderType === 'buy' ? { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' } : {}}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderType('sell')}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                orderType === 'sell' ? '' : 'text-gray-500 hover:text-white'
              }`}
              style={orderType === 'sell' ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' } : {}}
            >
              Sell
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>
                Price ({selectedPair.quote})
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.000000"
                step="0.000001"
                className="font-mono bg-black/50 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>
                Amount ({selectedPair.base})
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="font-mono bg-black/50 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>

            {/* Fee breakdown */}
            <div className="pt-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#6B7280' }}>Subtotal</span>
                <span className="font-mono" style={{ color: '#A1A1AA' }}>{getTotal()} {selectedPair.quote}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#6B7280' }}>Network Fee</span>
                <span className="font-mono" style={{ color: '#A1A1AA' }}>~0.00001 XRP</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#6B7280' }}>Platform Fee</span>
                <span className="font-mono" style={{ color: '#A1A1AA' }}>0.1%</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t mt-2" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                <span style={{ color: '#F5F5F7' }}>Total</span>
                <span className="font-mono" style={{ color: '#D4AF37' }}>{getTotal()} {selectedPair.quote}</span>
              </div>
            </div>

            <Button
              onClick={handleCreateOffer}
              disabled={loading || !isConnected || !price || !amount}
              className="w-full font-medium"
              style={{ 
                backgroundColor: orderType === 'buy' ? '#22C55E' : '#EF4444',
                color: '#0B0B0C'
              }}
            >
              {loading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${selectedPair.base}`}
            </Button>
            
            {!isConnected && (
              <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                Connect wallet to trade
              </p>
            )}
          </div>
        </div>

        {/* Order Book - Clean, minimal */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#121214', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Order Book</span>
            <span className="text-xs font-mono" style={{ color: '#6B7280' }}>{selectedPair.base}/{selectedPair.quote}</span>
          </div>
          
          {/* Column Headers */}
          <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-wider mb-2 pb-2 border-b" style={{ color: '#6B7280', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <span>Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
          
          {/* Asks (Sell Orders) */}
          <div className="space-y-0.5 mb-3">
            {orderBook.asks.slice().reverse().map((ask, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-white/5 cursor-pointer rounded">
                <span className="font-mono" style={{ color: '#EF4444' }}>{formatPrice(ask.price)}</span>
                <span className="text-right font-mono" style={{ color: '#A1A1AA' }}>{formatAmount(ask.amount)}</span>
                <span className="text-right font-mono" style={{ color: '#6B7280' }}>{ask.total.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Spread - Current Price */}
          <div className="py-2 px-3 rounded mb-3" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Spread</span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#D4AF37' }}>
                {((orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0)).toFixed(6)}
              </span>
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="space-y-0.5">
            {orderBook.bids.map((bid, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-white/5 cursor-pointer rounded">
                <span className="font-mono" style={{ color: '#22C55E' }}>{formatPrice(bid.price)}</span>
                <span className="text-right font-mono" style={{ color: '#A1A1AA' }}>{formatAmount(bid.amount)}</span>
                <span className="text-right font-mono" style={{ color: '#6B7280' }}>{bid.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Orders & Recent Trades - Institutional style */}
        <div className="rounded-lg" style={{ backgroundColor: '#121214', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <Tabs defaultValue="orders" className="w-full">
            <div className="border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="orders" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-4 py-3 text-xs uppercase tracking-wider"
                  style={{ color: '#A1A1AA' }}
                >
                  My Orders
                </TabsTrigger>
                <TabsTrigger 
                  value="trades"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-4 py-3 text-xs uppercase tracking-wider"
                  style={{ color: '#A1A1AA' }}
                >
                  Recent Trades
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="orders" className="p-4 mt-0">
              {myOffers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: '#6B7280' }}>No active orders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myOffers.map((offer) => (
                    <div key={offer.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: offer.type === 'buy' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: offer.type === 'buy' ? '#22C55E' : '#EF4444'
                          }}
                        >
                          {offer.type.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleCancelOffer(offer.id)}
                          disabled={loading}
                          className="text-xs hover:text-white transition-colors"
                          style={{ color: '#6B7280' }}
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span style={{ color: '#6B7280' }}>Price</span>
                          <p className="font-mono" style={{ color: '#F5F5F7' }}>{formatPrice(offer.price)}</p>
                        </div>
                        <div>
                          <span style={{ color: '#6B7280' }}>Amount</span>
                          <p className="font-mono" style={{ color: '#F5F5F7' }}>{formatAmount(offer.amount)}</p>
                        </div>
                        <div>
                          <span style={{ color: '#6B7280' }}>Total</span>
                          <p className="font-mono" style={{ color: '#D4AF37' }}>{offer.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trades" className="p-4 mt-0">
              {recentTrades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: '#6B7280' }}>No recent trades</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between text-xs py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
                      <div className="flex items-center gap-2">
                        {trade.type === 'buy' ? (
                          <TrendingUp className="h-3 w-3" style={{ color: '#22C55E' }} />
                        ) : (
                          <TrendingDown className="h-3 w-3" style={{ color: '#EF4444' }} />
                        )}
                        <span className="font-mono" style={{ color: '#F5F5F7' }}>{formatPrice(trade.price)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono" style={{ color: '#A1A1AA' }}>{formatAmount(trade.amount)}</div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>
                          {trade.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
