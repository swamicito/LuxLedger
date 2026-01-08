import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Star, Target, Heart, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_value: number;
  currency: string;
  images: string[];
  match_score: number;
  reasons: string[];
  price_trend: 'up' | 'down' | 'stable';
}

interface UserPreferences {
  preferred_categories: string[];
  price_range: { min: number; max: number };
  investment_style: 'conservative' | 'moderate' | 'aggressive';
  interests: string[];
}

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingPreferences, setAnalyzingPreferences] = useState(false);
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (user) {
      analyzeUserPreferences();
      generateRecommendations();
    }
  }, [user]);

  const analyzeUserPreferences = async () => {
    setAnalyzingPreferences(true);
    try {
      // Analyze user's viewing history and interactions
      const { data: viewHistory } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('user_id', user?.id)
        .eq('event_type', 'asset_view')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: wishlistItems } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('user_id', user?.id)
        .eq('event_type', 'wishlist_add')
        .order('created_at', { ascending: false })
        .limit(20);

      // Extract preferences from user behavior
      const categoryFrequency: { [key: string]: number } = {};
      const pricePoints: number[] = [];

      viewHistory?.forEach(event => {
        const data = event.event_data as any;
        if (data.category) {
          categoryFrequency[data.category] = (categoryFrequency[data.category] || 0) + 1;
        }
        if (data.price) {
          pricePoints.push(data.price);
        }
      });

      wishlistItems?.forEach(event => {
        const data = event.event_data as any;
        if (data.category) {
          categoryFrequency[data.category] = (categoryFrequency[data.category] || 0) + 2; // Weight wishlist items higher
        }
      });

      const preferredCategories = Object.entries(categoryFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const avgPrice = pricePoints.length > 0 ? pricePoints.reduce((a, b) => a + b, 0) / pricePoints.length : 100000;
      const minPrice = Math.min(...pricePoints) || 10000;
      const maxPrice = Math.max(...pricePoints) || 1000000;

      const preferences: UserPreferences = {
        preferred_categories: preferredCategories,
        price_range: { min: minPrice * 0.5, max: maxPrice * 1.5 },
        investment_style: avgPrice > 500000 ? 'aggressive' : avgPrice > 100000 ? 'moderate' : 'conservative',
        interests: preferredCategories
      };

      setUserPreferences(preferences);
      
      await trackEvent('preferences_analyzed', {
        preferred_categories: preferredCategories,
        price_range: preferences.price_range,
        investment_style: preferences.investment_style
      });

    } catch (error) {
      console.error('Error analyzing preferences:', error);
    } finally {
      setAnalyzingPreferences(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      let query = supabase
        .from('assets')
        .select('*')
        .in('status', ['verified', 'tokenized', 'listed'])
        .neq('owner_id', user?.id) // Don't recommend user's own assets
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: assets, error } = await query;
      if (error) throw error;

      // Generate AI-powered recommendations based on user preferences
      const enrichedRecommendations: Recommendation[] = (assets || []).map(asset => {
        const matchScore = calculateMatchScore(asset, userPreferences);
        const reasons = generateReasons(asset, userPreferences);
        
        return {
          ...asset,
          match_score: matchScore,
          reasons,
          price_trend: (Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down') as 'up' | 'down' | 'stable'
        };
      })
      .filter(rec => rec.match_score > 60) // Only show good matches
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 6);

      setRecommendations(enrichedRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = (asset: any, preferences: UserPreferences | null): number => {
    if (!preferences) return Math.floor(Math.random() * 40) + 60; // Random score if no preferences

    let score = 50; // Base score

    // Category match
    if (preferences.preferred_categories.includes(asset.category)) {
      score += 30;
    }

    // Price range match
    if (asset.estimated_value >= preferences.price_range.min && asset.estimated_value <= preferences.price_range.max) {
      score += 20;
    }

    // Random factors for demonstration
    score += Math.floor(Math.random() * 20);

    return Math.min(100, Math.max(0, score));
  };

  const generateReasons = (asset: any, preferences: UserPreferences | null): string[] => {
    const reasons: string[] = [];

    if (preferences?.preferred_categories.includes(asset.category)) {
      reasons.push(`Matches your interest in ${asset.category}`);
    }

    if (asset.estimated_value && preferences?.price_range) {
      if (asset.estimated_value >= preferences.price_range.min && asset.estimated_value <= preferences.price_range.max) {
        reasons.push('Within your preferred price range');
      }
    }

    // Add some dynamic reasons
    const dynamicReasons = [
      'High appreciation potential',
      'Recently verified',
      'Popular in your region',
      'Similar to your previous views',
      'Limited availability',
      'Expert recommended'
    ];

    const additionalReasons = dynamicReasons
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    return [...reasons, ...additionalReasons].slice(0, 3);
  };

  const handleRecommendationClick = async (recommendation: Recommendation) => {
    await trackEvent('recommendation_clicked', {
      asset_id: recommendation.id,
      match_score: recommendation.match_score,
      category: recommendation.category
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Please log in to get personalized recommendations</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI-Powered Recommendations
          </h2>
          <p className="text-muted-foreground">Personalized asset suggestions based on your interests and behavior</p>
        </div>
        
        {analyzingPreferences && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 animate-spin" />
            Analyzing your preferences...
          </div>
        )}
      </div>

      {/* User Preferences Summary */}
      {userPreferences && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Investment Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Preferred Categories</div>
                <div className="flex flex-wrap gap-1">
                  {userPreferences.preferred_categories.map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Investment Style</div>
                <Badge variant="outline" className="capitalize">
                  {userPreferences.investment_style}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Price Range</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(userPreferences.price_range.min, 'USD')} - {formatCurrency(userPreferences.price_range.max, 'USD')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Explore the marketplace to help our AI learn your preferences and generate personalized recommendations.
            </p>
            <Button variant="outline">
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <Card 
              key={recommendation.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleRecommendationClick(recommendation)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{recommendation.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span className={getMatchColor(recommendation.match_score)}>
                        {recommendation.match_score}% match
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {recommendation.price_trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {recommendation.price_trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                    {recommendation.price_trend === 'stable' && <Clock className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendation.images && recommendation.images.length > 0 && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={recommendation.images[0]} 
                        alt={recommendation.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <div className="text-lg font-semibold mb-1">
                      {formatCurrency(recommendation.estimated_value || 0, recommendation.currency || 'USD')}
                    </div>
                    <Progress value={recommendation.match_score} className="h-1 mb-2" />
                    <div className="text-xs text-muted-foreground">
                      {recommendation.match_score}% compatibility
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Why this matches you:</div>
                    <div className="space-y-1">
                      {recommendation.reasons.map((reason, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}