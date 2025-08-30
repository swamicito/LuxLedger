import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { smartRecommendationEngine, AssetRecommendation } from '@/lib/smart-recommendations';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import { TrendingUp, TrendingDown, Target, Lightbulb, Star, Shield, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface SmartRecommendationsProps {
  availableAssets?: any[];
  limit?: number;
}

export const SmartRecommendations = ({ availableAssets = [], limit = 6 }: SmartRecommendationsProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { walletAddress } = useWallet();
  const [recommendations, setRecommendations] = useState<AssetRecommendation[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      initializeRecommendations();
    }
  }, [user, initialized]);

  const initializeRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await smartRecommendationEngine.initialize(user.id, walletAddress);
      await generateRecommendations();
      const portfolioInsights = smartRecommendationEngine.getPortfolioInsights();
      setInsights(portfolioInsights);
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize recommendations:', error);
      toast.error('Failed to load personalized recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      // Mock available assets if none provided
      const assets = availableAssets.length > 0 ? availableAssets : [
        {
          id: '1',
          title: 'Manhattan Penthouse Token',
          category: 'real_estate',
          estimated_value: 125000,
          currency: 'USD',
          location: 'New York, USA',
          certification: 'Property deed verified'
        },
        {
          id: '2',
          title: 'Rolex Submariner 2023',
          category: 'watches',
          estimated_value: 15000,
          currency: 'USD',
          brand: 'Rolex',
          year: 2023,
          certification: 'Chronometer certified'
        },
        {
          id: '3',
          title: 'Tiffany Diamond Necklace',
          category: 'jewelry',
          estimated_value: 8500,
          currency: 'USD',
          brand: 'Tiffany & Co',
          certification: 'GIA certified'
        },
        {
          id: '4',
          title: 'Picasso Original Sketch',
          category: 'art',
          estimated_value: 45000,
          currency: 'USD',
          location: 'Paris, France',
          year: 1962,
          certification: 'Provenance verified'
        },
        {
          id: '5',
          title: 'Ferrari 488 GTB',
          category: 'cars',
          estimated_value: 275000,
          currency: 'USD',
          brand: 'Ferrari',
          year: 2020,
          location: 'Monaco'
        }
      ];

      const recs = await smartRecommendationEngine.generateRecommendations(assets, limit);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to generate recommendations');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Personalized Recommendations</h3>
          <p className="text-muted-foreground mb-4">Sign in to get AI-powered investment recommendations</p>
          <Button variant="outline">Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Portfolio Insights
            </CardTitle>
            <CardDescription>AI-powered analysis of your investment portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                Personalized asset suggestions based on your profile and market trends
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={generateRecommendations} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recommendations available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.assetId} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{rec.category.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${getScoreColor(rec.score)}`}>
                            {Math.round(rec.score * 100)}% Match
                          </div>
                          <Progress value={rec.score * 100} className="w-16 h-2 mt-1" />
                        </div>
                      </div>

                      {/* Price and Risk */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">{formatCurrency(rec.price, rec.currency)}</span>
                        </div>
                        <Badge className={`text-xs ${getRiskColor(rec.riskLevel)}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {rec.riskLevel} risk
                        </Badge>
                      </div>

                      {/* Expected Return and Time Horizon */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">Return:</span>
                          <span className="font-medium">{rec.expectedReturn}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">Horizon:</span>
                          <span className="font-medium">{rec.timeHorizon}</span>
                        </div>
                      </div>

                      {/* Metadata */}
                      {(rec.metadata.brand || rec.metadata.location || rec.metadata.year) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {rec.metadata.brand && (
                            <div>Brand: {rec.metadata.brand}</div>
                          )}
                          {rec.metadata.location && (
                            <div>Location: {rec.metadata.location}</div>
                          )}
                          {rec.metadata.year && (
                            <div>Year: {rec.metadata.year}</div>
                          )}
                        </div>
                      )}

                      {/* Reasons */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Why recommended:</p>
                        <div className="space-y-1">
                          {rec.reasons.slice(0, 3).map((reason, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-xs text-muted-foreground">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button size="sm" className="w-full">
                        View Asset Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Compact version for dashboard
export const SmartRecommendationsCompact = ({ limit = 3 }: { limit?: number }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AssetRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await smartRecommendationEngine.initialize(user.id);
      const recs = await smartRecommendationEngine.generateRecommendations([], limit);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Smart Picks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Smart Picks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.slice(0, limit).map((rec) => (
            <div key={rec.assetId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{rec.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {Math.round(rec.score * 100)}% match • {rec.expectedReturn}
                </p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: rec.currency,
                    notation: 'compact'
                  }).format(rec.price)}
                </div>
                <Badge className={`text-xs ${getRiskColor(rec.riskLevel)}`}>
                  {rec.riskLevel}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4">
          View All Recommendations
        </Button>
      </CardContent>
    </Card>
  );

  function getRiskColor(risk: string) {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
};
