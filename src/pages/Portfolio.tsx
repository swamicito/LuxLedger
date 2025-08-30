import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { useWallet } from '@/hooks/use-wallet';
import { supabase } from '@/integrations/supabase/client';
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your portfolio</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Portfolio</h1>
              <p className="text-muted-foreground">Manage your luxury asset investments</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>
              {!account && (
                <Button onClick={connectWallet}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold">{analytics.totalAssets || 0}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics.tokenizedAssets || 0} tokenized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trade Volume</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalTradeVolume || 0)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics.recentTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Status</p>
                    <p className="text-lg font-bold">
                      {account ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <Wallet className={`h-8 w-8 ${account ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                {account && (
                  <p className="text-sm text-muted-foreground mt-2 truncate">
                    {account.address}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

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
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="aspect-square bg-muted rounded-t-lg"></div>
                        <CardContent className="p-4 space-y-2">
                          <div className="h-4 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </CardContent>
                      </Card>
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
                  <div className="text-center py-12">
                    <Gem className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No assets yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start building your portfolio by adding your first luxury asset.
                    </p>
                    <Button onClick={() => navigate('/dashboard')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Asset
                    </Button>
                  </div>
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