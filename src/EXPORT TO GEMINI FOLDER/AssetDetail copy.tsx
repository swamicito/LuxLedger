import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { useWallet } from '@/hooks/use-wallet';
import { supabase } from '@/lib/supabase-client';
import { 
  ArrowLeft,
  Share2,
  Heart,
  TrendingUp,
  Shield,
  FileText,
  Clock,
  DollarSign,
  Zap,
  Eye,
  Users,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { account, connectWallet, signTransaction } = useWallet();
  const [asset, setAsset] = useState<any>(null);
  const [provenance, setProvenance] = useState<any[]>([]);
  const [nftData, setNftData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssetDetails();
      trackEvent('asset_detail_view', { asset_id: id });
    }
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      // Fetch asset details
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select(`
          *,
          profiles:owner_id (full_name, profile_image_url),
          nft_tokens (*),
          provenance_records (*)
        `)
        .eq('id', id)
        .single();

      if (assetError) throw assetError;
      
      setAsset(assetData);
      setProvenance(assetData.provenance_records || []);
      setNftData(assetData.nft_tokens?.[0] || null);
    } catch (error) {
      console.error('Error fetching asset:', error);
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    try {
      trackEvent('trade_initiate', { asset_id: id, amount: bidAmount });
      
      // Simulate transaction signing
      const txHash = await signTransaction({
        type: 'asset_purchase',
        assetId: id,
        amount: bidAmount,
        currency: asset.currency
      });

      // Create transaction record
      const { error } = await supabase
        .from('transactions')
        .insert({
          asset_id: id,
          buyer_id: user?.id,
          seller_id: asset.owner_id,
          price: parseFloat(bidAmount),
          currency: asset.currency,
          transaction_hash: txHash,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Trade initiated successfully!');
      setBidAmount('');
    } catch (error) {
      console.error('Error processing trade:', error);
      toast.error('Failed to process trade');
    }
  };

  const handleTokenize = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    try {
      trackEvent('tokenization_request', { asset_id: id });
      
      const txHash = await signTransaction({
        type: 'nft_mint',
        assetId: id,
        metadata: {
          title: asset.title,
          description: asset.description,
          image: asset.images[0]
        }
      });

      const { error } = await supabase
        .from('nft_tokens')
        .insert({
          asset_id: id,
          minted_by: user?.id,
          token_id: `TK${Date.now()}`,
          contract_address: '0x' + Math.random().toString(16).substr(2, 8),
          metadata_uri: `ipfs://metadata/${id}`,
          blockchain: 'XRPL'
        });

      if (error) throw error;

      toast.success('Asset tokenized successfully!');
      fetchAssetDetails();
    } catch (error) {
      console.error('Error tokenizing asset:', error);
      toast.error('Failed to tokenize asset');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Asset not found</h2>
            <Button onClick={() => navigate('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/marketplace')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLiked(!isLiked);
                trackEvent('asset_like', { asset_id: id });
              }}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                trackEvent('asset_share', { asset_id: id });
                toast.success('Share link copied!');
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Asset Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden">
              {asset.images && asset.images.length > 0 ? (
                <img 
                  src={asset.images[0]} 
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shield className="h-24 w-24 text-primary/50" />
                </div>
              )}
            </div>
            
            {/* Additional Images */}
            {asset.images && asset.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {asset.images.slice(1, 5).map((image: string, index: number) => (
                  <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                    <img src={image} alt={`${asset.title} ${index + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asset Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={
                  asset.status === 'listed' ? 'default' :
                  asset.status === 'tokenized' ? 'secondary' :
                  'outline'
                }>
                  {nftData ? 'NFT' : asset.status}
                </Badge>
                {nftData && (
                  <Badge variant="outline">
                    Token ID: {nftData.token_id}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
              <p className="text-muted-foreground text-lg">{asset.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">{formatCurrency(asset.estimated_value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-semibold">{asset.profiles?.full_name || 'Anonymous'}</p>
              </div>
            </div>

            {/* Trading Interface */}
            {asset.status === 'listed' && user?.id !== asset.owner_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Place Bid</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Bid Amount ({asset.currency})</label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      placeholder="Enter your bid..."
                    />
                  </div>
                  <Button 
                    onClick={handleTrade}
                    className="w-full"
                    disabled={!bidAmount}
                  >
                    {!account ? 'Connect Wallet to Trade' : 'Place Bid'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tokenization */}
            {asset.status === 'verified' && user?.id === asset.owner_id && !nftData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Tokenize Asset</span>
                  </CardTitle>
                  <CardDescription>
                    Convert your asset into an NFT for trading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleTokenize} className="w-full">
                    {!account ? 'Connect Wallet to Tokenize' : 'Create NFT'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="provenance">Provenance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Asset Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <p className="text-muted-foreground capitalize">{asset.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Created</h4>
                    <p className="text-muted-foreground">{new Date(asset.created_at).toLocaleDateString()}</p>
                  </div>
                  {asset.specifications && Object.entries(asset.specifications).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="font-semibold mb-2 capitalize">{key.replace('_', ' ')}</h4>
                      <p className="text-muted-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="provenance">
            <Card>
              <CardHeader>
                <CardTitle>Ownership History</CardTitle>
                <CardDescription>Track the complete ownership chain of this asset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {provenance.length > 0 ? (
                    provenance.map((record, index) => (
                      <div key={record.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold">Transfer #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.transfer_date).toLocaleDateString()}
                          </p>
                          {record.transfer_price && (
                            <p className="text-sm">
                              Price: {formatCurrency(record.transfer_price)}
                            </p>
                          )}
                        </div>
                        {record.transaction_hash && (
                          <Badge variant="outline">
                            TX: {record.transaction_hash.slice(0, 8)}...
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No provenance records available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">1,247</p>
                      <p className="text-sm text-muted-foreground">Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">+12.5%</p>
                      <p className="text-sm text-muted-foreground">Value Change</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">34</p>
                      <p className="text-sm text-muted-foreground">Interested</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Verification Documents</CardTitle>
                <CardDescription>Official documents and certifications for this asset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {asset.verification_documents && asset.verification_documents.length > 0 ? (
                    asset.verification_documents.map((doc: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="flex-grow">Document {index + 1}</span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No documents available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}