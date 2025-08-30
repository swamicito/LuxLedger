import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/hooks/use-wallet';
import { Tag, TrendingUp, Clock, Eye, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssetForSale {
  id: string;
  title: string;
  description: string;
  category: string;
  currentValue: number;
  listingPrice: number;
  priceChange: number;
  images: string[];
  tokenId?: string;
  fractionalShares?: number;
  totalShares?: number;
  status: 'draft' | 'listed' | 'sold' | 'withdrawn';
  listedAt?: Date;
  views: number;
  interested: number;
}

interface ResaleOffer {
  id: string;
  assetId: string;
  buyerAddress: string;
  offerPrice: number;
  message: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export const PortfolioResale = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress } = useWallet();
  const [assetsForSale, setAssetsForSale] = useState<AssetForSale[]>([]);
  const [offers, setOffers] = useState<ResaleOffer[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetForSale | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchAssetsForSale();
      fetchOffers();
    }
  }, [isConnected]);

  const fetchAssetsForSale = async () => {
    // Mock data - in production, fetch from backend
    setAssetsForSale([
      {
        id: 'asset1',
        title: 'Luxury Watch Collection Share',
        description: 'Premium Rolex Submariner tokenized share',
        category: 'watches',
        currentValue: 15000,
        listingPrice: 16500,
        priceChange: 10,
        images: ['/assets/watch1.jpg'],
        fractionalShares: 10,
        totalShares: 100,
        status: 'listed',
        listedAt: new Date('2024-01-20'),
        views: 45,
        interested: 7
      }
    ]);
  };

  const fetchOffers = async () => {
    // Mock data - in production, fetch from backend
    setOffers([
      {
        id: 'offer1',
        assetId: 'asset1',
        buyerAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        offerPrice: 16000,
        message: 'Interested in purchasing your watch shares. Can we negotiate?',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      }
    ]);
  };

  const handleListAsset = async () => {
    if (!selectedAsset || !listingPrice) return;

    setLoading(true);
    try {
      // Mock listing transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedAsset = {
        ...selectedAsset,
        listingPrice: parseFloat(listingPrice),
        description: listingDescription || selectedAsset.description,
        status: 'listed' as const,
        listedAt: new Date()
      };

      setAssetsForSale(prev => prev.map(asset => 
        asset.id === selectedAsset.id ? updatedAsset : asset
      ));

      toast.success('Asset listed for sale successfully');
      setSelectedAsset(null);
      setListingPrice('');
      setListingDescription('');
    } catch (error) {
      toast.error('Failed to list asset');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setLoading(true);
    try {
      // Mock offer acceptance
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOffers(prev => prev.map(offer => 
        offer.id === offerId ? { ...offer, status: 'accepted' } : offer
      ));

      toast.success('Offer accepted successfully');
    } catch (error) {
      toast.error('Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setOffers(prev => prev.map(offer => 
      offer.id === offerId ? { ...offer, status: 'rejected' } : offer
    ));
    toast.success('Offer rejected');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'listed': return 'default';
      case 'sold': return 'secondary';
      case 'draft': return 'outline';
      case 'withdrawn': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Assets for Sale */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">My Assets for Sale</h3>
          <Button onClick={() => setSelectedAsset({
            id: 'new',
            title: '',
            description: '',
            category: '',
            currentValue: 0,
            listingPrice: 0,
            priceChange: 0,
            images: [],
            status: 'draft',
            views: 0,
            interested: 0
          })}>
            <Tag className="h-4 w-4 mr-2" />
            List New Asset
          </Button>
        </div>

        {assetsForSale.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Assets Listed</h3>
              <p className="text-muted-foreground mb-4">
                Start selling your tokenized assets to other investors
              </p>
              <Button onClick={() => setSelectedAsset({
                id: 'new',
                title: '',
                description: '',
                category: '',
                currentValue: 0,
                listingPrice: 0,
                priceChange: 0,
                images: [],
                status: 'draft',
                views: 0,
                interested: 0
              })}>
                List Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assetsForSale.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      {asset.title}
                    </CardTitle>
                    <Badge variant={getStatusColor(asset.status) as any}>
                      {asset.status}
                    </Badge>
                  </div>
                  <CardDescription>{asset.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Current Value</div>
                      <div className="font-semibold">{formatCurrency(asset.currentValue)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Listed Price</div>
                      <div className="font-semibold text-green-600">{formatCurrency(asset.listingPrice)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Views</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {asset.views}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Interested</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {asset.interested}
                      </div>
                    </div>
                  </div>

                  {asset.fractionalShares && (
                    <div className="text-sm">
                      <div className="text-muted-foreground">Shares for Sale</div>
                      <div className="font-semibold">
                        {asset.fractionalShares} of {asset.totalShares} shares ({((asset.fractionalShares / asset.totalShares!) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      Edit Listing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Share functionality coming soon')}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    {asset.status === 'listed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Withdrawal functionality coming soon')}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Offers Received */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Offers Received</h3>
        
        {offers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No offers received yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const asset = assetsForSale.find(a => a.id === offer.assetId);
              const daysLeft = Math.ceil((offer.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Offer for {asset?.title}</CardTitle>
                      <Badge variant={offer.status === 'pending' ? 'secondary' : 'outline'}>
                        {offer.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Offer Price</div>
                        <div className="font-semibold text-lg">{formatCurrency(offer.offerPrice)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Your Price</div>
                        <div className="font-semibold">{formatCurrency(asset?.listingPrice || 0)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expires</div>
                        <div className="font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft} days
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Buyer Address</div>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {offer.buyerAddress}
                      </div>
                    </div>

                    {offer.message && (
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Message</div>
                        <div className="text-sm bg-muted p-3 rounded">
                          {offer.message}
                        </div>
                      </div>
                    )}

                    {offer.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={loading}
                          className="flex-1"
                        >
                          Accept Offer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectOffer(offer.id)}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Listing Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {selectedAsset.id === 'new' ? 'List New Asset' : 'Edit Listing'}
              </CardTitle>
              <CardDescription>
                Set your price and description for the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Listing Price (USD)</label>
                <Input
                  type="number"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="Enter listing price"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={listingDescription}
                  onChange={(e) => setListingDescription(e.target.value)}
                  placeholder="Describe your asset and why buyers should be interested"
                  rows={3}
                />
              </div>

              {selectedAsset.currentValue > 0 && (
                <div className="text-sm text-muted-foreground">
                  Current market value: {formatCurrency(selectedAsset.currentValue)}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAsset(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleListAsset}
                  disabled={loading || !listingPrice}
                  className="flex-1"
                >
                  {loading ? 'Listing...' : 'List Asset'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
