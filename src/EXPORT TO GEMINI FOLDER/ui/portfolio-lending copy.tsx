import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useWallet } from '@/hooks/use-wallet';
import { Coins, TrendingUp, Clock, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LendingPool {
  id: string;
  name: string;
  asset: string;
  apr: number;
  totalLiquidity: number;
  availableToLend: number;
  minAmount: number;
  maxAmount: number;
  lockPeriod: number; // days
  risk: 'low' | 'medium' | 'high';
}

interface LendingPosition {
  id: string;
  poolId: string;
  amount: number;
  apr: number;
  startDate: Date;
  maturityDate: Date;
  earnedInterest: number;
  status: 'active' | 'matured' | 'withdrawn';
}

const LENDING_POOLS: LendingPool[] = [
  {
    id: 'xrp-stable',
    name: 'XRP Stable Pool',
    asset: 'XRP',
    apr: 5.2,
    totalLiquidity: 1000000,
    availableToLend: 750000,
    minAmount: 100,
    maxAmount: 50000,
    lockPeriod: 30,
    risk: 'low'
  },
  {
    id: 'luxury-backed',
    name: 'Luxury Asset Backed',
    asset: 'LUXURY',
    apr: 8.5,
    totalLiquidity: 500000,
    availableToLend: 300000,
    minAmount: 1000,
    maxAmount: 100000,
    lockPeriod: 90,
    risk: 'medium'
  },
  {
    id: 'real-estate',
    name: 'Real Estate Pool',
    asset: 'REIT',
    apr: 12.3,
    totalLiquidity: 2000000,
    availableToLend: 1200000,
    minAmount: 5000,
    maxAmount: 500000,
    lockPeriod: 180,
    risk: 'high'
  }
];

export const PortfolioLending = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress } = useWallet();
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null);
  const [lendAmount, setLendAmount] = useState(1000);
  const [positions, setPositions] = useState<LendingPosition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchLendingPositions();
    }
  }, [isConnected]);

  const fetchLendingPositions = async () => {
    // Mock data - in production, fetch from backend
    setPositions([
      {
        id: 'pos1',
        poolId: 'xrp-stable',
        amount: 5000,
        apr: 5.2,
        startDate: new Date('2024-01-15'),
        maturityDate: new Date('2024-02-14'),
        earnedInterest: 21.37,
        status: 'active'
      }
    ]);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const calculateProjectedEarnings = (pool: LendingPool, amount: number) => {
    const dailyRate = pool.apr / 365 / 100;
    return amount * dailyRate * pool.lockPeriod;
  };

  const handleLend = async () => {
    if (!selectedPool || !isConnected) return;

    setLoading(true);
    try {
      // Mock lending transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully lent ${lendAmount} ${selectedPool.asset}`);
      fetchLendingPositions();
      setSelectedPool(null);
      setLendAmount(1000);
    } catch (error) {
      toast.error('Failed to create lending position');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (positionId: string) => {
    setLoading(true);
    try {
      // Mock withdrawal transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Successfully withdrawn lending position');
      fetchLendingPositions();
    } catch (error) {
      toast.error('Failed to withdraw position');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pools">Lending Pools</TabsTrigger>
          <TabsTrigger value="positions">My Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-4">
          <div className="grid gap-4">
            {LENDING_POOLS.map((pool) => (
              <Card key={pool.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      {pool.name}
                    </CardTitle>
                    <Badge variant={getRiskBadgeVariant(pool.risk) as any}>
                      {pool.risk} risk
                    </Badge>
                  </div>
                  <CardDescription>
                    Earn {pool.apr}% APR by lending {pool.asset} tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">APR</div>
                      <div className="font-semibold text-green-600">{pool.apr}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Lock Period</div>
                      <div className="font-semibold">{pool.lockPeriod} days</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min Amount</div>
                      <div className="font-semibold">{pool.minAmount.toLocaleString()} {pool.asset}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Available</div>
                      <div className="font-semibold">{pool.availableToLend.toLocaleString()} {pool.asset}</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedPool(pool)}
                    className="w-full"
                    disabled={!isConnected}
                  >
                    {isConnected ? 'Lend to Pool' : 'Connect Wallet'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          {positions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Lending Positions</h3>
                <p className="text-muted-foreground mb-4">
                  Start earning passive income by lending your tokens
                </p>
                <Button onClick={() => setSelectedPool(LENDING_POOLS[0])}>
                  Explore Lending Pools
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => {
                const pool = LENDING_POOLS.find(p => p.id === position.poolId);
                const daysRemaining = Math.ceil((position.maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isMatured = daysRemaining <= 0;

                return (
                  <Card key={position.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pool?.name}</CardTitle>
                        <Badge variant={isMatured ? 'default' : 'secondary'}>
                          {isMatured ? 'Matured' : `${daysRemaining} days left`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Amount Lent</div>
                          <div className="font-semibold">{position.amount.toLocaleString()} {pool?.asset}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">APR</div>
                          <div className="font-semibold text-green-600">{position.apr}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Earned Interest</div>
                          <div className="font-semibold text-green-600">
                            +{position.earnedInterest.toFixed(2)} {pool?.asset}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Value</div>
                          <div className="font-semibold">
                            {(position.amount + position.earnedInterest).toFixed(2)} {pool?.asset}
                          </div>
                        </div>
                      </div>

                      {isMatured && (
                        <Button
                          onClick={() => handleWithdraw(position.id)}
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? 'Withdrawing...' : 'Withdraw Position'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lending Modal */}
      {selectedPool && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Lend to {selectedPool.name}</CardTitle>
                <CardDescription>
                  Earn {selectedPool.apr}% APR for {selectedPool.lockPeriod} days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Lend</label>
                  <Input
                    type="number"
                    value={lendAmount}
                    onChange={(e) => setLendAmount(Number(e.target.value))}
                    min={selectedPool.minAmount}
                    max={selectedPool.maxAmount}
                  />
                  <div className="text-xs text-muted-foreground">
                    Min: {selectedPool.minAmount.toLocaleString()} - Max: {selectedPool.maxAmount.toLocaleString()} {selectedPool.asset}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Projected Earnings:</span>
                    <span className="font-semibold text-green-600">
                      +{calculateProjectedEarnings(selectedPool, lendAmount).toFixed(2)} {selectedPool.asset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lock Period:</span>
                    <span>{selectedPool.lockPeriod} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maturity Date:</span>
                    <span>{new Date(Date.now() + selectedPool.lockPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div className="text-xs text-yellow-800">
                    <strong>Risk Notice:</strong> This is a {selectedPool.risk} risk pool. 
                    Your funds will be locked for {selectedPool.lockPeriod} days.
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPool(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLend}
                    disabled={loading || lendAmount < selectedPool.minAmount || lendAmount > selectedPool.maxAmount}
                    className="flex-1"
                  >
                    {loading ? 'Processing...' : 'Confirm Lending'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
};
