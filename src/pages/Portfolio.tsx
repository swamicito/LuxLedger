import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { useWallet } from '@/hooks/use-wallet';
import { supabase } from '@/lib/supabase-client';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Eye,
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Gem,
  Car,
  Home,
  Watch,
  Wine,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { EmptyPortfolio, EmptyActivity } from '@/components/ui/empty-state';
import { AssetCardSkeleton } from '@/components/ui/skeleton-loaders';

type CategoryKey = 'jewelry' | 'watches' | 'art' | 'real_estate' | 'cars' | 'wine' | 'collectibles';

const categoryIcons: Record<CategoryKey, any> = {
  jewelry: Gem,
  watches: Watch,
  art: Palette,
  real_estate: Home,
  cars: Car,
  wine: Wine,
  collectibles: Gem,
};

export default function Portfolio() {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { account, connectWallet } = useWallet();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
      trackEvent('portfolio_view');
    }
  }, [user, timeframe]);

  const fetchPortfolioData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user's assets
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          nft_tokens (token_id, contract_address),
          provenance_records (transfer_price, transfer_date)
        `)
        .eq('owner_id', user.id);

      if (assetsError) throw assetsError;

      // Fetch user's transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          assets (title, category, images)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      setAssets(assetsData || []);
      setTransactions(transactionsData || []);
      
      // Calculate analytics
      calculateAnalytics(assetsData || [], transactionsData || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (userAssets: any[], userTransactions: any[]) => {
    const totalValue = userAssets.reduce((sum, asset) => sum + (asset.estimated_value || 0), 0);
    const totalAssets = userAssets.length;
    const tokenizedAssets = userAssets.filter(asset => asset.status === 'tokenized').length;
    
    const categoryBreakdown = userAssets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + (asset.estimated_value || 0);
      return acc;
    }, {});

    const recentTransactions = userTransactions.filter(tx => 
      new Date(tx.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const totalTradeVolume = recentTransactions.reduce((sum, tx) => sum + (tx.price || 0), 0);
    
    // Mock performance data
    const performance = {
      '7d': Math.random() * 20 - 10,
      '30d': Math.random() * 40 - 20,
      '90d': Math.random() * 60 - 30,
    };

    setAnalytics({
      totalValue,
      totalAssets,
      tokenizedAssets,
      categoryBreakdown,
      totalTradeVolume,
      performance,
      recentTransactions: recentTransactions.length
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return ArrowUpRight;
    if (value < 0) return ArrowDownRight;
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Wallet className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please sign in to view your portfolio</p>
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
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                MY PORTFOLIO
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Manage your luxury asset investments
              </p>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Total Value</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{formatCurrency(analytics.totalValue || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Assets</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{assets.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Period</p>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="h-7 w-[90px] text-sm bg-transparent border-white/10" style={{ color: '#F5F5F7' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Right: Wallet Status */}
            <div className="flex items-center gap-3">
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
        <div className="space-y-8">

          {/* Portfolio Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalValue || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                </div>
                {analytics.performance && (
                  <div className={`flex items-center mt-2 ${getPerformanceColor(analytics.performance[timeframe])}`}>
                    {analytics.performance[timeframe] > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm">
                      {analytics.performance[timeframe] > 0 ? '+' : ''}
                      {analytics.performance[timeframe]?.toFixed(2)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Assets</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalAssets || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {analytics.tokenizedAssets || 0} tokenized
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Trade Volume</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalTradeVolume || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {analytics.recentTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Wallet Status</p>
                    <p className="text-lg font-bold text-white">
                      {account ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${account ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <Wallet className={`h-6 w-6 ${account ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                </div>
                {account && (
                  <p className="text-sm text-gray-400 mt-2 truncate">
                    {account.address}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <Tabs defaultValue="assets" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assets">My Assets</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="yield">Yield</TabsTrigger>
            </TabsList>

            <TabsContent value="assets">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Your Assets</h3>
                  <Button onClick={() => navigate('/dashboard')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <AssetCardSkeleton key={i} />
                    ))}
                  </div>
                ) : assets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map((asset) => {
                      const CategoryIcon = categoryIcons[asset.category as CategoryKey] || Gem;
                      const hasNFT = asset.nft_tokens && asset.nft_tokens.length > 0;
                      
                      return (
                        <Card 
                          key={asset.id} 
                          className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/asset/${asset.id}`)}
                        >
                          <CardHeader className="p-0">
                            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                              {asset.images && asset.images.length > 0 ? (
                                <img 
                                  src={asset.images[0]} 
                                  alt={asset.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <CategoryIcon className="h-16 w-16 text-primary/50" />
                              )}
                              
                              <div className="absolute top-3 left-3">
                                <Badge variant={
                                  asset.status === 'listed' ? 'default' :
                                  asset.status === 'tokenized' ? 'secondary' :
                                  'outline'
                                }>
                                  {hasNFT ? 'NFT' : asset.status}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <h3 className="font-semibold text-lg line-clamp-1">{asset.title}</h3>
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {asset.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CategoryIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm capitalize text-muted-foreground">
                                  {asset.category.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg">
                                  {formatCurrency(asset.estimated_value || 0)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>View Details</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPortfolio onBrowse={() => navigate('/marketplace')} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest trading activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-500' :
                              transaction.status === 'pending' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <div>
                              <p className="font-semibold">
                                {transaction.buyer_id === user?.id ? 'Purchase' : 'Sale'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.assets?.title || 'Unknown Asset'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.buyer_id === user?.id ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {transaction.buyer_id === user?.id ? '-' : '+'}
                              {formatCurrency(transaction.price)}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No transactions yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Breakdown</CardTitle>
                    <CardDescription>Assets by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.categoryBreakdown || {}).map(([category, value]) => {
                        const CategoryIcon = categoryIcons[category as CategoryKey] || Gem;
                        const percentage = ((value as number) / analytics.totalValue * 100).toFixed(1);
                        
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                              <span className="capitalize">{category.replace('_', ' ')}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(value as number)}</p>
                              <p className="text-sm text-muted-foreground">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Portfolio performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(analytics.performance || {}).map(([period, value]) => {
                        const PerformanceIcon = getPerformanceIcon(value as number);
                        
                        return (
                          <div key={period} className="flex items-center justify-between">
                            <span className="text-sm uppercase tracking-wide">{period}</span>
                            <div className={`flex items-center space-x-2 ${getPerformanceColor(value as number)}`}>
                              {PerformanceIcon && <PerformanceIcon className="h-4 w-4" />}
                              <span className="font-semibold">
                                {value as number > 0 ? '+' : ''}{(value as number).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="yield">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Yield Opportunities</CardTitle>
                    <CardDescription>Earn passive income from your assets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Asset Staking</h4>
                          <Badge variant="secondary">8.5% APY</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Stake your tokenized assets to earn rewards
                        </p>
                        <Button size="sm" variant="outline">
                          Start Staking
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Liquidity Provision</h4>
                          <Badge variant="secondary">12.3% APY</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Provide liquidity to trading pairs
                        </p>
                        <Button size="sm" variant="outline">
                          Provide Liquidity
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Current Yields</CardTitle>
                    <CardDescription>Your active yield positions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active yield positions</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start earning by staking your assets
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}