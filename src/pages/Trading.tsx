import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DEXTradingInterface } from '@/components/ui/dex-trading-interface';
import { ChatbotToggle } from '@/components/ui/ai-chatbot';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { useWallet } from '@/hooks/use-wallet';
import { supabase } from '@/lib/supabase-client';
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ArrowUpDown,
  Clock,
  DollarSign,
  BarChart3,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export default function Trading() {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { account, connectWallet, signTransaction } = useWallet();
  const navigate = useNavigate();
  
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orderBook, setOrderBook] = useState<{bids: OrderBookEntry[], asks: OrderBookEntry[]}>({bids: [], asks: []});
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTradingData();
    trackEvent('trading_view');
    
    // Setup real-time updates (mock)
    const interval = setInterval(updateMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTradingData = async () => {
    setLoading(true);
    try {
      // Fetch tradeable assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          nft_tokens (token_id, contract_address),
          profiles:owner_id (full_name)
        `)
        .in('status', ['tokenized', 'listed']);

      if (assetsError) throw assetsError;

      // Fetch recent transactions for market data
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          assets (title, category)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      // Generate market data from assets and transactions
      const markets = assets?.map(asset => generateMarketData(asset, transactions || [])) || [];
      setMarketData(markets);
      
      if (markets.length > 0 && !selectedAsset) {
        setSelectedAsset(assets?.[0]);
        generateOrderBook(assets?.[0]);
      }

      setRecentTrades(transactions?.slice(0, 20) || []);

      // Fetch user's open orders (mock for now)
      if (user) {
        const mockUserOrders = [
          {
            id: '1',
            type: 'limit',
            side: 'buy',
            asset: 'Diamond Ring',
            amount: 0.5,
            price: 25000,
            status: 'open',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            type: 'limit',
            side: 'sell',
            asset: 'Vintage Watch',
            amount: 1.0,
            price: 15000,
            status: 'partial',
            created_at: new Date().toISOString()
          }
        ];
        setUserOrders(mockUserOrders);
      }
    } catch (error) {
      console.error('Error fetching trading data:', error);
      toast.error('Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  const generateMarketData = (asset: any, transactions: any[]): MarketData => {
    const relatedTx = transactions.filter(tx => tx.assets?.title === asset.title);
    const volume24h = relatedTx.reduce((sum, tx) => sum + (tx.price || 0), 0);
    
    return {
      symbol: asset.title,
      price: asset.estimated_value || 0,
      change24h: (Math.random() - 0.5) * 20, // Mock change
      volume24h,
      high24h: (asset.estimated_value || 0) * (1 + Math.random() * 0.1),
      low24h: (asset.estimated_value || 0) * (1 - Math.random() * 0.1)
    };
  };

  const generateOrderBook = (asset: any) => {
    const basePrice = asset.estimated_value || 10000;
    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];

    // Generate mock order book
    for (let i = 0; i < 10; i++) {
      const bidPrice = basePrice * (1 - (i + 1) * 0.01);
      const askPrice = basePrice * (1 + (i + 1) * 0.01);
      const quantity = Math.random() * 2 + 0.1;

      bids.push({
        price: bidPrice,
        quantity,
        total: bidPrice * quantity
      });

      asks.push({
        price: askPrice,
        quantity,
        total: askPrice * quantity
      });
    }

    setOrderBook({ bids, asks });
  };

  const updateMarketData = () => {
    setMarketData(prev => prev.map(market => ({
      ...market,
      price: market.price * (1 + (Math.random() - 0.5) * 0.02),
      change24h: market.change24h + (Math.random() - 0.5) * 2
    })));
  };

  const handleTrade = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    if (!selectedAsset || !amount) {
      toast.error('Please select an asset and enter amount');
      return;
    }

    try {
      trackEvent('trade_execute', { 
        asset_id: selectedAsset.id,
        type: tradeType,
        order_type: orderType,
        amount: parseFloat(amount)
      });

      const tradePrice = orderType === 'market' ? selectedAsset.estimated_value : parseFloat(price);
      
      // Sign transaction
      const txHash = await signTransaction({
        type: 'trade',
        assetId: selectedAsset.id,
        side: tradeType,
        amount: parseFloat(amount),
        price: tradePrice
      });

      // Create transaction record
      const { error } = await supabase
        .from('transactions')
        .insert({
          asset_id: selectedAsset.id,
          buyer_id: tradeType === 'buy' ? user?.id : selectedAsset.owner_id,
          seller_id: tradeType === 'sell' ? user?.id : selectedAsset.owner_id,
          price: tradePrice * parseFloat(amount),
          currency: selectedAsset.currency,
          transaction_hash: txHash,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} order placed successfully!`);
      setAmount('');
      setPrice('');
      fetchTradingData();
    } catch (error) {
      console.error('Error executing trade:', error);
      toast.error('Failed to execute trade');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please sign in to access trading features</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header - Matte black, minimal, data-aware */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Title */}
            <div className="min-w-0 flex-shrink">
              <h1 className="text-sm sm:text-lg md:text-xl font-medium tracking-wide truncate" style={{ color: '#D4AF37' }}>
                TRADING TERMINAL
              </h1>
              <p className="text-xs sm:text-sm hidden sm:block" style={{ color: '#6B7280' }}>
                Tokenized luxury assets · Real-time execution
              </p>
            </div>
            
            {/* Center: Market Status */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>24h Volume</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>
                  {formatCompactCurrency(marketData.reduce((sum, m) => sum + m.volume24h, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Active Markets</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{marketData.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Status</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm font-medium" style={{ color: '#22C55E' }}>Live</p>
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchTradingData}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {!account ? (
                <Button 
                  onClick={connectWallet}
                  size="sm"
                  className="font-medium"
                  style={{ backgroundColor: '#D4AF37', color: '#0B0B0C' }}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-mono" style={{ color: '#22C55E' }}>
                    {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">


          {/* DEX Trading Interface */}
          <DEXTradingInterface />

          {/* Legacy Trading Interface (can be removed later) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8" style={{ display: 'none' }}>
            {/* Market List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Markets</CardTitle>
                  <CardDescription>Select an asset to trade</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-12 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      marketData.map((market, index) => (
                        <div
                          key={index}
                          className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedAsset?.title === market.symbol ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => {
                            const asset = marketData.find(m => m.symbol === market.symbol);
                            if (asset) {
                              setSelectedAsset(asset);
                              generateOrderBook(asset);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{market.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                Vol: {formatCompactCurrency(market.volume24h)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">{formatCurrency(market.price)}</p>
                              <div className={`flex items-center text-xs ${
                                market.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {market.change24h >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {Math.abs(market.change24h).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Book & Chart */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="orderbook" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="orderbook">Order Book</TabsTrigger>
                  <TabsTrigger value="chart">Price Chart</TabsTrigger>
                  <TabsTrigger value="trades">Recent Trades</TabsTrigger>
                </TabsList>

                <TabsContent value="orderbook">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Book - {selectedAsset?.title || 'Select Asset'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Bids */}
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Bids</h4>
                          <div className="space-y-1">
                            <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2">
                              <span>Price</span>
                              <span>Size</span>
                              <span>Total</span>
                            </div>
                            {orderBook.bids.map((bid, index) => (
                              <div key={index} className="grid grid-cols-3 text-xs">
                                <span className="text-green-600">{formatCurrency(bid.price)}</span>
                                <span>{bid.quantity.toFixed(2)}</span>
                                <span>{formatCurrency(bid.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Asks */}
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2">Asks</h4>
                          <div className="space-y-1">
                            <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2">
                              <span>Price</span>
                              <span>Size</span>
                              <span>Total</span>
                            </div>
                            {orderBook.asks.map((ask, index) => (
                              <div key={index} className="grid grid-cols-3 text-xs">
                                <span className="text-red-600">{formatCurrency(ask.price)}</span>
                                <span>{ask.quantity.toFixed(2)}</span>
                                <span>{formatCurrency(ask.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chart">
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Chart coming soon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trades">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 text-xs text-muted-foreground mb-2">
                          <span>Asset</span>
                          <span>Price</span>
                          <span>Size</span>
                          <span>Time</span>
                        </div>
                        {recentTrades.slice(0, 10).map((trade) => (
                          <div key={trade.id} className="grid grid-cols-4 text-xs py-1">
                            <span>{trade.assets?.title || 'Unknown'}</span>
                            <span className={trade.buyer_id === user?.id ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(trade.price)}
                            </span>
                            <span>1.00</span>
                            <span className="text-muted-foreground">
                              {new Date(trade.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Trading Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Place Order</CardTitle>
                  <CardDescription>
                    {selectedAsset ? `Trading ${selectedAsset.title}` : 'Select an asset to trade'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trade Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={tradeType === 'buy' ? 'default' : 'outline'}
                      onClick={() => setTradeType('buy')}
                      className="w-full"
                    >
                      Buy
                    </Button>
                    <Button
                      variant={tradeType === 'sell' ? 'destructive' : 'outline'}
                      onClick={() => setTradeType('sell')}
                      className="w-full"
                    >
                      Sell
                    </Button>
                  </div>

                  {/* Order Type */}
                  <Select value={orderType} onValueChange={(value: 'market' | 'limit') => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Amount */}
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  {/* Price (for limit orders) */}
                  {orderType === 'limit' && (
                    <div>
                      <label className="text-sm font-medium">Price (USD)</label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Order Summary */}
                  {selectedAsset && amount && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            parseFloat(amount) * 
                            (orderType === 'limit' && price ? parseFloat(price) : selectedAsset.estimated_value)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Est. Fees:</span>
                        <span>$2.50</span>
                      </div>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <Button
                    onClick={handleTrade}
                    disabled={!selectedAsset || !amount || (orderType === 'limit' && !price)}
                    className="w-full"
                    variant={tradeType === 'buy' ? 'default' : 'destructive'}
                  >
                    {!account ? 'Connect Wallet' : 
                     !selectedAsset ? 'Select Asset' :
                     `${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} ${selectedAsset.title}`}
                  </Button>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Quick amounts:</p>
                    <div className="grid grid-cols-4 gap-1">
                      {['0.25', '0.5', '0.75', '1.0'].map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(quickAmount)}
                          className="text-xs"
                        >
                          {quickAmount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Orders */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Open Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {userOrders.filter(order => order.status !== 'filled').length > 0 ? (
                    <div className="space-y-2">
                      {userOrders.filter(order => order.status !== 'filled').map((order) => (
                        <div key={order.id} className="p-2 border rounded text-xs">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className={`font-medium ${
                                order.side === 'buy' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {order.side.toUpperCase()}
                              </span>
                              <span className="ml-2">{order.amount}</span>
                            </div>
                            <Badge variant={
                              order.status === 'open' ? 'default' :
                              order.status === 'partial' ? 'secondary' :
                              'outline'
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between mt-1 text-muted-foreground">
                            <span>{order.asset}</span>
                            <span>{formatCurrency(order.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No open orders</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* AI Chatbot */}
        <ChatbotToggle />
      </div>
    </div>
  );
}