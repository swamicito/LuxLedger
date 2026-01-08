import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { supabase } from '@/lib/supabase-client';
import { geoService } from '@/lib/geo-utils';
import { TrustStrip } from '@/components/ui/trust-strip';
import { AssetCardSkeleton, LoadingMoreIndicator, EndOfListIndicator } from '@/components/ui/skeleton-loaders';
import { usePagination } from '@/hooks/use-pagination';
import { EmptyMarketplace } from '@/components/ui/empty-state';
import { 
  Search, 
  Filter, 
  Gem, 
  Eye, 
  Heart,
  Share2,
  Clock,
  DollarSign,
  Palette,
  Car,
  Home,
  Watch,
  Wine
} from 'lucide-react';
import { toast } from 'sonner';

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

const PAGE_SIZE = 12;

export default function Marketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const [assets, setAssets] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('global');
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [regionalConfig, setRegionalConfig] = useState<any>(null);

  const pagination = usePagination<any>({
    pageSize: PAGE_SIZE,
    totalItems: totalCount,
  });

  useEffect(() => {
    initializeRegionalSettings();
    trackEvent('marketplace_view');
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, selectedRegion, sortBy, pagination.currentPage]);

  const initializeRegionalSettings = async () => {
    try {
      const location = await geoService.getUserLocation();
      const config = geoService.getRegionalConfig(location.countryCode);
      setUserLocation(location);
      setRegionalConfig(config);
    } catch (error) {
      console.error('Failed to get regional settings:', error);
    }
  };

  const fetchAssets = async () => {
    const isFirstPage = pagination.currentPage === 1;
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Get total count first
      const { count } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['verified', 'tokenized', 'listed']);
      
      setTotalCount(count || 0);

      let query = supabase
        .from('assets')
        .select(`
          *,
          profiles:owner_id (full_name),
          nft_tokens (token_id, contract_address)
        `)
        .in('status', ['verified', 'tokenized', 'listed'])
        .range(pagination.startIndex, pagination.startIndex + PAGE_SIZE - 1);

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as CategoryKey);
      }

      if (selectedRegion !== 'global') {
        query = query.eq('region', selectedRegion);
      }

      // Filter by price range
      query = query
        .gte('estimated_value', priceRange[0])
        .lte('estimated_value', priceRange[1]);

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_high':
          query = query.order('estimated_value', { ascending: false });
          break;
        case 'price_low':
          query = query.order('estimated_value', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      
      if (isFirstPage) {
        setAssets(data || []);
      } else {
        setAssets(prev => [...prev, ...(data || [])]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    const currency = userLocation?.currency || 'USD';
    const locale = userLocation?.language === 'ar' ? 'ar-SA' : 
                   userLocation?.language === 'zh' ? 'zh-CN' :
                   userLocation?.language === 'ru' ? 'ru-RU' :
                   userLocation?.language === 'es' ? 'es-ES' : 'en-US';
    
    if (currency !== 'USD') {
      const convertedValue = geoService.convertCurrency(value, 'USD', currency);
      return geoService.formatCurrency(convertedValue, currency, locale);
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const handleAssetClick = (assetId: string) => {
    trackEvent('asset_view', { asset_id: assetId });
    navigate(`/asset/${assetId}`);
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && pagination.hasNextPage) {
      pagination.nextPage();
    }
  }, [loadingMore, pagination]);

  const handleWishlist = (assetId: string) => {
    trackEvent('wishlist_add', { asset_id: assetId });
    toast.success('Added to wishlist');
  };

  const handleShare = (assetId: string) => {
    trackEvent('asset_share', { asset_id: assetId });
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">{t('marketplace.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('marketplace.subtitle')}
            </p>
            
            {/* Trust Strip */}
            <div className="max-w-4xl mx-auto mt-6">
              <TrustStrip variant="compact" />
            </div>
            {regionalConfig?.legalDisclaimer && (
              <div className="max-w-3xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Legal Notice:</strong> {regionalConfig.legalDisclaimer}
                </p>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('marketplace.search') || 'Search assets...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('marketplace.filters.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('marketplace.filters.all')}</SelectItem>
                    <SelectItem value="jewelry">{t('marketplace.filters.jewelry')}</SelectItem>
                    <SelectItem value="watches">{t('marketplace.filters.watches')}</SelectItem>
                    <SelectItem value="art">{t('marketplace.filters.art')}</SelectItem>
                    <SelectItem value="real_estate">{t('marketplace.filters.realEstate')}</SelectItem>
                    <SelectItem value="cars">{t('marketplace.filters.exoticCars')}</SelectItem>
                    <SelectItem value="wine">Wine</SelectItem>
                    <SelectItem value="collectibles">Collectibles</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Region Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('marketplace.filters.region')}</label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">{t('marketplace.regions.global')}</SelectItem>
                        <SelectItem value="north_america">{t('marketplace.regions.northAmerica')}</SelectItem>
                        <SelectItem value="europe">{t('marketplace.regions.europe')}</SelectItem>
                        <SelectItem value="asia">{t('marketplace.regions.asia')}</SelectItem>
                        <SelectItem value="middle_east">{t('marketplace.regions.middleEast')}</SelectItem>
                        <SelectItem value="latin_america">{t('marketplace.regions.latinAmerica')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('marketplace.filters.priceRange')}</label>
                    <div className="px-3">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={10000000}
                        min={0}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Asset Type Filters */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Asset Type</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="nft" />
                        <label htmlFor="nft" className="text-sm">NFTs Only</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="fungible" />
                        <label htmlFor="fungible" className="text-sm">Fungible Tokens</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="verified" />
                        <label htmlFor="verified" className="text-sm">Verified Only</label>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredAssets.length} assets found
            </p>
          </div>

          {/* Asset Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <AssetCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => {
                const CategoryIcon = categoryIcons[asset.category as CategoryKey] || Gem;
                const hasNFT = asset.nft_tokens && asset.nft_tokens.length > 0;
                
                return (
                  <Card 
                    key={asset.id} 
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => handleAssetClick(asset.id)}
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
                        
                        {/* Asset Status Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge variant={
                            asset.status === 'listed' ? 'default' :
                            asset.status === 'tokenized' ? 'secondary' :
                            'outline'
                          }>
                            {hasNFT ? 'NFT' : asset.status}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWishlist(asset.id);
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(asset.id);
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
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
                          <span>by {asset.profiles?.full_name || 'Anonymous'}</span>
                        </div>
                      </div>

                      {asset.status === 'listed' && (
                        <Button 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackEvent('bid_interest', { asset_id: asset.id });
                            toast.success('Bidding feature coming soon!');
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Place Bid
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredAssets.length === 0 && !loading && (
            <EmptyMarketplace 
              onBrowse={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedRegion('global');
                setPriceRange([0, 10000000]);
              }} 
            />
          )}

          {/* Load More / End of List */}
          {!loading && filteredAssets.length > 0 && (
            <div className="mt-8">
              {loadingMore ? (
                <LoadingMoreIndicator />
              ) : pagination.hasNextPage ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="px-8"
                  >
                    Load More Assets
                  </Button>
                </div>
              ) : (
                <EndOfListIndicator text="You've seen all available assets" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}