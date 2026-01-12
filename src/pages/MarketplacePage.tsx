"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Listing {
  id: string;
  title: string;
  description: string;
  price_usd: number;
  category: string;
  token_type: 'nft' | 'iou' | 'offchain';
  media_url: string | null;
  seller_address: string;
  created_at: string;
  approved: boolean;
}

// Demo listings for when database is empty or table doesn't exist
const DEMO_LISTINGS: Listing[] = [
  {
    id: 'demo-1',
    title: 'Patek Philippe Nautilus 5711',
    description: 'Rare stainless steel Nautilus with blue dial. Complete set with box and papers. Excellent condition.',
    price_usd: 185000,
    category: 'Watches',
    token_type: 'nft',
    media_url: null,
    seller_address: 'rDemoSeller1xxxxxxxxxxxxxxxxxxxxx',
    created_at: new Date().toISOString(),
    approved: true,
  },
  {
    id: 'demo-2',
    title: 'Cartier Love Bracelet 18K Rose Gold',
    description: 'Classic Cartier Love bracelet in 18K rose gold. Size 17. Includes screwdriver and original box.',
    price_usd: 8500,
    category: 'Jewelry',
    token_type: 'nft',
    media_url: null,
    seller_address: 'rDemoSeller2xxxxxxxxxxxxxxxxxxxxx',
    created_at: new Date().toISOString(),
    approved: true,
  },
  {
    id: 'demo-3',
    title: '2023 Porsche 911 GT3 RS',
    description: 'Brand new GT3 RS in GT Silver Metallic. Weissach Package. Only 500 miles.',
    price_usd: 325000,
    category: 'Cars',
    token_type: 'offchain',
    media_url: null,
    seller_address: 'rDemoSeller3xxxxxxxxxxxxxxxxxxxxx',
    created_at: new Date().toISOString(),
    approved: true,
  },
  {
    id: 'demo-4',
    title: 'Banksy "Girl with Balloon" Print',
    description: 'Authenticated Banksy print. Numbered edition 150/600. Professionally framed.',
    price_usd: 95000,
    category: 'Art',
    token_type: 'nft',
    media_url: null,
    seller_address: 'rDemoSeller4xxxxxxxxxxxxxxxxxxxxx',
    created_at: new Date().toISOString(),
    approved: true,
  },
  {
    id: 'demo-5',
    title: 'Hermès Birkin 25 Togo Leather',
    description: 'Hermès Birkin 25 in Noir Togo leather with gold hardware. Stamp Y. Pristine condition.',
    price_usd: 42000,
    category: 'Fashion',
    token_type: 'nft',
    media_url: null,
    seller_address: 'rDemoSeller5xxxxxxxxxxxxxxxxxxxxx',
    created_at: new Date().toISOString(),
    approved: true,
  },
  {
    id: 'demo-6',
    title: 'Rolex Daytona 116500LN White Dial',
    description: 'Rolex Cosmograph Daytona with ceramic bezel. 2023 card. Unworn condition.',
    price_usd: 32500,
    category: 'Watches',
    token_type: 'nft',
    media_url: null,
    seller_address: 'rDemoSeller6xxxxxxxxxxxxxxxxxxxxx',
    created_at: new Date().toISOString(),
    approved: true,
  },
];

const categories = [
  'All Categories',
  'Jewelry',
  'Watches',
  'Cars',
  'Real Estate',
  'Art',
  'Collectibles',
  'Fashion',
  'Electronics'
];

const tokenTypes = [
  'All Types',
  'NFT',
  'IOU Token',
  'Off-chain'
];

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('All Types');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterAndSortListings();
  }, [listings, searchTerm, selectedCategory, selectedType, sortBy]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        // Table doesn't exist or other error - use demo data
        console.warn('Using demo listings:', error.message);
        setListings(DEMO_LISTINGS);
      } else if (!data || data.length === 0) {
        // Table exists but empty - use demo data
        setListings(DEMO_LISTINGS);
      } else {
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings(DEMO_LISTINGS);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortListings = () => {
    let filtered = [...listings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(listing => 
        listing.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Type filter
    if (selectedType !== 'All Types') {
      const typeMap = { 'NFT': 'nft', 'IOU Token': 'iou', 'Off-chain': 'offchain' };
      filtered = filtered.filter(listing => 
        listing.token_type === typeMap[selectedType as keyof typeof typeMap]
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price_usd - b.price_usd);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price_usd - a.price_usd);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredListings(filtered);
  };

  const handleBuyNow = (listing: Listing) => {
    // Navigate to asset purchase/escrow checkout page
    navigate(`/purchase/${listing.id}`, { 
      state: { 
        listing,
        fromMarketplace: true 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading luxury marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header - Matte black, minimal */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-lg sm:text-xl font-medium tracking-wide whitespace-nowrap" style={{ color: '#D4AF37' }}>
                LUXURY MARKETPLACE
              </h1>
              <span className="hidden sm:inline text-gray-600">·</span>
              <p className="text-xs sm:text-sm whitespace-nowrap" style={{ color: '#6B7280' }}>
                Authenticated · Blockchain verified
              </p>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Listed Items</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{filteredListings.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Categories</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{categories.length - 1}</p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm" style={{ color: '#22C55E' }}>Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Filters and Search - Institutional style */}
        <div 
          className="rounded-lg p-4 mb-6"
          style={{ backgroundColor: '#121214', border: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                <Input
                  placeholder="Search luxury items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-mono text-sm bg-black/50 border-white/10 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokenTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <p className="text-gray-400">
              {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Listings Grid/List */}
        {filteredListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-2xl font-semibold mb-2">No items found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
            : "space-y-4"
          }>
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={viewMode === 'grid' 
                  ? "bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-600/50 transition-all duration-300 group"
                  : "bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800 hover:border-yellow-600/50 transition-all duration-300 flex gap-4 sm:gap-6"
                }
              >
                {/* Image */}
                <div className={viewMode === 'grid' ? "aspect-square overflow-hidden" : "w-24 sm:w-32 h-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden"}>
                  {listing.media_url ? (
                    <img
                      src={listing.media_url}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                      <div className="text-2xl sm:text-4xl">🏺</div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={viewMode === 'grid' ? "p-3 sm:p-4 md:p-6" : "flex-1"}>
                  <div className="flex items-start justify-between mb-1 sm:mb-2 gap-1">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                      {listing.title}
                    </h3>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                      listing.token_type === 'nft' ? 'bg-purple-600/20 text-purple-400' :
                      listing.token_type === 'iou' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {listing.token_type.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                    {listing.description}
                  </p>

                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">
                      {listing.category}
                    </span>
                    <span className="text-sm sm:text-base md:text-lg font-bold text-yellow-400">
                      ${listing.price_usd.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-1.5 sm:gap-2">
                    <Button
                      onClick={() => handleBuyNow(listing)}
                      size="sm"
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-medium text-xs sm:text-sm h-8 sm:h-9"
                    >
                      Buy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9 hidden sm:flex"
                    >
                      Details
                    </Button>
                  </div>

                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-800 hidden sm:block">
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      Seller: {listing.seller_address.slice(0, 8)}...{listing.seller_address.slice(-6)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
