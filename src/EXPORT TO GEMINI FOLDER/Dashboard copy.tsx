import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import { geoService } from '@/lib/geo-utils';
import { ProtectedRoute } from '@/components/ui/protected-route';
import { 
  TrendingUp, 
  Users, 
  Gem, 
  DollarSign, 
  Activity,
  Shield,
  Clock,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { t } = useTranslation();
  const { trackEvent, getDashboardMetrics, getAssetPerformance, getUserEngagement } = useAnalytics();
  const { user, userRole } = useAuth();
  const { isConnected, walletAddress } = useWallet();
  const [metrics, setMetrics] = useState<any>(null);
  const [assetPerformance, setAssetPerformance] = useState<any>(null);
  const [userEngagement, setUserEngagement] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [metricsData, performanceData, engagementData] = await Promise.all([
        getDashboardMetrics(),
        getAssetPerformance(),
        getUserEngagement(),
      ]);
      
      setMetrics(metricsData);
      setAssetPerformance(performanceData);
      setUserEngagement(engagementData);
      
      // Initialize regional settings
      const location = await geoService.getUserLocation();
      setUserLocation(location);
      
      // Mock KYC status - in production, fetch from backend
      setKycStatus(user?.kyc_status || 'none');
      
      setLoading(false);
      
      trackEvent('dashboard_view', { role: userRole });
    };

    fetchData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Monitor platform performance and user engagement
              </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{metrics?.newUsers || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                  <Gem className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalAssets || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.verifiedAssets || 0} verified
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(metrics?.totalVolume || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.totalTransactions || 0} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.approvedKyc || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.pendingKyc || 0} pending review
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="engagement" className="space-y-6">
              <TabsList>
                <TabsTrigger value="engagement">User Engagement</TabsTrigger>
                <TabsTrigger value="assets">Asset Performance</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="engagement" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Active Users */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Active Users</CardTitle>
                      <CardDescription>User engagement over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userEngagement?.dailyEngagement || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="activeUsers" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Events */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Events</CardTitle>
                      <CardDescription>Most common user actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(userEngagement?.topEvents || {}).map(([event, count]) => ({ event, count }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="event" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Asset Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Categories</CardTitle>
                      <CardDescription>Distribution by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(assetPerformance?.categoryPerformance || {}).map(([category, data]: [string, any]) => ({
                              name: category,
                              value: data.count,
                              totalValue: data.totalValue
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {Object.entries(assetPerformance?.categoryPerformance || {}).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category Values */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Values</CardTitle>
                      <CardDescription>Total estimated value by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(assetPerformance?.categoryPerformance || {}).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                              <span className="capitalize text-sm font-medium">{category}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {formatCurrency(data.totalValue)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {data.count} assets
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Asset Activity</CardTitle>
                    <CardDescription>Latest asset submissions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assetPerformance?.recentActivity?.map((asset: any) => (
                        <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Gem className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{asset.title}</h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {asset.category} • {formatCurrency(asset.estimated_value || 0)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              asset.status === 'verified' ? 'default' :
                              asset.status === 'pending_verification' ? 'secondary' :
                              'outline'
                            }>
                              {asset.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(asset.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}