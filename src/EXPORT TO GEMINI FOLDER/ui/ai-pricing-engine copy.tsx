import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Target, Brain, BarChart3, DollarSign, Sparkles, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface PriceAnalysis {
  asset_id: string;
  current_estimate: number;
  ai_recommendation: number;
  confidence_level: number;
  market_sentiment: 'bullish' | 'bearish' | 'neutral';
  comparable_sales: Array<{
    title: string;
    sale_price: number;
    sale_date: string;
    similarity_score: number;
  }>;
  price_factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  volatility_index: number;
  liquidity_score: number;
  trend_direction: 'up' | 'down' | 'stable';
}

interface MarketTrend {
  date: string;
  price: number;
  volume: number;
  sentiment: number;
}

export function AIPricingEngine() {
  const [selectedAsset, setSelectedAsset] = useState("asset_1");
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("30d");

  useEffect(() => {
    loadPriceAnalysis();
    loadMarketTrends();
  }, [selectedAsset, timeframe]);

  const loadPriceAnalysis = async () => {
    setLoading(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis: PriceAnalysis = {
        asset_id: selectedAsset,
        current_estimate: 125000,
        ai_recommendation: 142500,
        confidence_level: 87,
        market_sentiment: 'bullish',
        comparable_sales: [
          {
            title: "Similar Rolex Submariner",
            sale_price: 138000,
            sale_date: "2024-01-10",
            similarity_score: 94
          },
          {
            title: "Vintage Rolex GMT",
            sale_price: 155000,
            sale_date: "2024-01-08",
            similarity_score: 89
          },
          {
            title: "Rolex Daytona Classic",
            sale_price: 128000,
            sale_date: "2024-01-05",
            similarity_score: 82
          }
        ],
        price_factors: [
          {
            factor: "Market Demand",
            impact: 15,
            description: "High collector interest in vintage timepieces"
          },
          {
            factor: "Condition",
            impact: 12,
            description: "Excellent preservation with original documentation"
          },
          {
            factor: "Rarity",
            impact: 8,
            description: "Limited production year increases value"
          },
          {
            factor: "Market Timing",
            impact: 5,
            description: "Q1 typically shows strong luxury watch sales"
          }
        ],
        volatility_index: 23,
        liquidity_score: 76,
        trend_direction: 'up'
      };
      
      setPriceAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error loading price analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketTrends = async () => {
    // Generate mock market trend data
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const trends: MarketTrend[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        price: 120000 + Math.random() * 25000 + (i * 200),
        volume: Math.floor(Math.random() * 50) + 10,
        sentiment: Math.random() * 100
      });
    }
    
    setMarketTrends(trends);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200';
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const calculatePriceChange = () => {
    if (!priceAnalysis) return { amount: 0, percentage: 0 };
    
    const change = priceAnalysis.ai_recommendation - priceAnalysis.current_estimate;
    const percentage = (change / priceAnalysis.current_estimate) * 100;
    
    return { amount: change, percentage };
  };

  const priceChange = calculatePriceChange();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Pricing Engine
          </h2>
          <p className="text-muted-foreground">Real-time price recommendations powered by machine learning</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset_1">Vintage Rolex Submariner 1969</SelectItem>
              <SelectItem value="asset_2">Monet Water Lilies Print</SelectItem>
              <SelectItem value="asset_3">London Penthouse Share</SelectItem>
              <SelectItem value="asset_4">Ferrari 250 GT Certificate</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7D</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
              <SelectItem value="90d">90D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : priceAnalysis ? (
        <>
          {/* Price Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Estimate</p>
                    <p className="text-2xl font-bold">{formatCurrency(priceAnalysis.current_estimate)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AI Recommendation</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(priceAnalysis.ai_recommendation)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{priceChange.percentage.toFixed(1)}% ({formatCurrency(priceChange.amount)})
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Confidence Level</p>
                    <p className={`text-2xl font-bold ${getConfidenceColor(priceAnalysis.confidence_level)}`}>
                      {priceAnalysis.confidence_level}%
                    </p>
                    <Progress value={priceAnalysis.confidence_level} className="h-1 mt-2" />
                  </div>
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Market Sentiment</p>
                    <Badge className={`${getSentimentColor(priceAnalysis.market_sentiment)} border`}>
                      {getTrendIcon(priceAnalysis.trend_direction)}
                      <span className="ml-1 capitalize">{priceAnalysis.market_sentiment}</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Volatility: {priceAnalysis.volatility_index}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Trend Analysis</CardTitle>
              <CardDescription>Historical price movements and volume data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marketTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'price' ? formatCurrency(value) : value,
                        name === 'price' ? 'Price' : name === 'volume' ? 'Volume' : 'Sentiment'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparable Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Comparable Sales</CardTitle>
                <CardDescription>Recent sales of similar assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceAnalysis.comparable_sales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{sale.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(sale.sale_price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {sale.similarity_score}% similar
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Price Impact Factors</CardTitle>
                <CardDescription>Key factors influencing the AI recommendation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceAnalysis.price_factors.map((factor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{factor.factor}</span>
                        <Badge variant="outline" className="text-xs">
                          +{factor.impact}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{factor.description}</div>
                      <Progress value={factor.impact * 5} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Risk Assessment
              </CardTitle>
              <CardDescription>Market risk factors and liquidity analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{priceAnalysis.volatility_index}%</div>
                  <div className="text-sm text-muted-foreground">Volatility Index</div>
                  <Progress value={priceAnalysis.volatility_index} className="h-1 mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{priceAnalysis.liquidity_score}%</div>
                  <div className="text-sm text-muted-foreground">Liquidity Score</div>
                  <Progress value={priceAnalysis.liquidity_score} className="h-1 mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">A+</div>
                  <div className="text-sm text-muted-foreground">Overall Rating</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Low risk, high liquidity
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
              Accept AI Recommendation
            </Button>
            <Button variant="outline" size="lg">
              Request Detailed Analysis
            </Button>
            <Button variant="outline" size="lg">
              Set Price Alert
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}