import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, TrendingUp, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Asset {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_value: number;
  currency: string;
  images: string[];
  status: string;
  region_id?: string;
}

interface Region {
  id: string;
  name: string;
  country: string;
  timezone: string;
  currency_code: string;
  language_code: string;
  is_active: boolean;
}

export function RegionalMarketplace() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegions();
    fetchAssets();
  }, [selectedRegion, sortBy]);

  const fetchRegions = async () => {
    try {
      // Set default regions for demo until database types are regenerated
      setRegions([
        { id: '1', name: 'New York', country: 'United States', timezone: 'America/New_York', currency_code: 'USD', language_code: 'en', is_active: true },
        { id: '2', name: 'London', country: 'United Kingdom', timezone: 'Europe/London', currency_code: 'GBP', language_code: 'en', is_active: true },
        { id: '3', name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', currency_code: 'JPY', language_code: 'ja', is_active: true },
        { id: '4', name: 'Paris', country: 'France', timezone: 'Europe/Paris', currency_code: 'EUR', language_code: 'fr', is_active: true },
        { id: '5', name: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', currency_code: 'AED', language_code: 'ar', is_active: true },
      ]);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      let query = supabase
        .from('assets')
        .select('*')
        .in('status', ['verified', 'tokenized', 'listed']);

      if (selectedRegion !== "all") {
        query = query.eq('region_id', selectedRegion);
      }

      if (sortBy === 'price_asc') {
        query = query.order('estimated_value', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('estimated_value', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getRegionInfo = (regionId: string) => {
    return regions.find(r => r.id === regionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Regional Marketplace
          </h2>
          <p className="text-muted-foreground">Discover luxury assets from around the world</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {region.name}, {region.country}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Region Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{regions.length}</div>
                <div className="text-xs text-muted-foreground">Active Regions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{filteredAssets.length}</div>
                <div className="text-xs text-muted-foreground">Available Assets</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredAssets.reduce((sum, asset) => sum + (asset.estimated_value || 0), 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Value (USD)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(filteredAssets.map(a => a.category)).size}
                </div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
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
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
            <p className="text-muted-foreground text-center">
              {selectedRegion !== "all" 
                ? "No assets available in the selected region. Try selecting a different region."
                : "No assets match your search criteria. Try adjusting your filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const regionInfo = getRegionInfo(asset.region_id || '');
            
            return (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-2">{asset.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {regionInfo ? `${regionInfo.name}, ${regionInfo.country}` : 'Global'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {asset.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asset.images && asset.images.length > 0 && (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={asset.images[0]} 
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {asset.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(asset.estimated_value || 0, regionInfo?.currency_code || 'USD')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Estimated Value
                        </div>
                      </div>
                      <Badge variant={asset.status === 'listed' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </div>

                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}