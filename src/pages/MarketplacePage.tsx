"use client";

import { useEffect, useState } from "react";
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

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
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
    // Navigate to escrow creation or detail page
    console.log('Buy now clicked for:', listing.id);
    // TODO: Implement escrow flow
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border-b border-yellow-600/30">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Luxury Marketplace
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover authenticated luxury items backed by blockchain technology
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search luxury items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800">
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
        </motion.div>

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
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={viewMode === 'grid' 
                  ? "bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-600/50 transition-all duration-300 group"
                  : "bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-yellow-600/50 transition-all duration-300 flex gap-6"
                }
              >
                {/* Image */}
                <div className={viewMode === 'grid' ? "aspect-square overflow-hidden" : "w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden"}>
                  {listing.media_url ? (
                    <img
                      src={listing.media_url}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                      <div className="text-4xl">🏺</div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={viewMode === 'grid' ? "p-6" : "flex-1"}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                      {listing.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listing.token_type === 'nft' ? 'bg-purple-600/20 text-purple-400' :
                      listing.token_type === 'iou' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {listing.token_type.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {listing.category}
                    </span>
                    <span className="text-lg font-bold text-yellow-400">
                      ${listing.price_usd.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBuyNow(listing)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-medium"
                    >
                      Buy Now
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Details
                    </Button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
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
