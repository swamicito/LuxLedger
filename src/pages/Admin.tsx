import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AssetType } from '@/lib/xrpl-client';
import { assetManager } from '@/lib/asset-manager';
import { Plus, Upload, Eye, Edit, Trash2, Flag, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

// Mock moderation queue data
const mockModerationQueue = [
  {
    id: 'mod_001',
    type: 'listing',
    title: 'Suspicious Rolex Listing',
    reason: 'Reported as potential counterfeit',
    reportedBy: 'user_456',
    reportedAt: '2024-01-18T10:30:00Z',
    status: 'pending',
    itemId: 'asset_123',
  },
  {
    id: 'mod_002',
    type: 'user',
    title: 'Multiple failed verification attempts',
    reason: 'User submitted 3 rejected KYC documents',
    reportedBy: 'system',
    reportedAt: '2024-01-19T14:00:00Z',
    status: 'pending',
    itemId: 'user_789',
  },
  {
    id: 'mod_003',
    type: 'listing',
    title: 'Price manipulation suspected',
    reason: 'Listing price changed 5 times in 24 hours',
    reportedBy: 'system',
    reportedAt: '2024-01-20T09:15:00Z',
    status: 'reviewed',
    itemId: 'asset_456',
  },
];

const Admin = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [moderationQueue, setModerationQueue] = useState(mockModerationQueue);

  // Form state for creating new assets
  const [newAsset, setNewAsset] = useState({
    type: AssetType.REAL_ESTATE,
    name: '',
    description: '',
    price: '',
    totalSupply: '1000000',
    location: '',
    image: '',
    certification: '',
    appraisal: '',
    specifications: {},
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/auth');
      return;
    }
    
    if (user && userRole === 'admin') {
      loadAssets();
    }
  }, [user, userRole, loading, navigate]);

  const loadAssets = async () => {
    try {
      const allAssets = await assetManager.getAllAssets();
      setAssets(allAssets);
    } catch (error) {
      toast.error('Failed to load assets');
    }
  };

  const handleCreateAsset = async () => {
    if (!newAsset.name || !newAsset.description || !newAsset.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      if (newAsset.type === AssetType.REAL_ESTATE) {
        await assetManager.createRealEstateToken(
          {
            name: newAsset.name,
            description: newAsset.description,
            location: newAsset.location,
            totalValue: newAsset.price,
            totalSupply: newAsset.totalSupply,
            image: newAsset.image,
            certification: newAsset.certification,
            appraisal: newAsset.appraisal,
          },
          'demo-issuer-seed'
        );
      } else {
        await assetManager.createLuxuryNFT(
          {
            name: newAsset.name,
            description: newAsset.description,
            type: newAsset.type,
            price: newAsset.price,
            image: newAsset.image,
            certification: newAsset.certification,
            appraisal: newAsset.appraisal,
            specifications: newAsset.specifications,
          },
          'demo-minter-seed'
        );
      }

      toast.success('Asset created successfully!');
      setNewAsset({
        type: AssetType.REAL_ESTATE,
        name: '',
        description: '',
        price: '',
        totalSupply: '1000000',
        location: '',
        image: '',
        certification: '',
        appraisal: '',
        specifications: {},
      });
      loadAssets();
    } catch (error) {
      toast.error('Failed to create asset');
    } finally {
      setIsCreating(false);
    }
  };

  const getAssetTypeColor = (type: AssetType) => {
    switch (type) {
      case AssetType.REAL_ESTATE:
        return 'bg-blue-100 text-blue-800';
      case AssetType.JEWELRY:
        return 'bg-purple-100 text-purple-800';
      case AssetType.EXOTIC_CAR:
        return 'bg-red-100 text-red-800';
      case AssetType.WATCH:
        return 'bg-green-100 text-green-800';
      case AssetType.ART:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || userRole !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Access Denied</div>;
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                ADMIN PANEL
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Asset management · Moderation · Operations
              </p>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Assets</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{assets.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Pending</p>
                <p className="text-lg font-semibold" style={{ color: '#FBBF24' }}>
                  {moderationQueue.filter(m => m.status === 'pending').length}
                </p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm" style={{ color: '#EF4444' }}>Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="moderation" className="relative">
            Moderation
            {moderationQueue.filter(m => m.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                {moderationQueue.filter(m => m.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="create">Create Asset</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Real Estate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assets.filter(a => a.type === AssetType.REAL_ESTATE).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Luxury NFTs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assets.filter(a => a.type !== AssetType.REAL_ESTATE).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${assets.reduce((sum, asset) => sum + parseFloat(asset.currentPrice || '0'), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Flag className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {moderationQueue.filter(m => m.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-orange-500" />
                Moderation Queue
              </CardTitle>
              <CardDescription>Review flagged content and user reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationQueue.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No items pending review</p>
                  </div>
                ) : (
                  moderationQueue.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${
                          item.status === 'pending' ? 'bg-orange-100' : 'bg-green-100'
                        }`}>
                          {item.status === 'pending' ? (
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant={item.type === 'listing' ? 'default' : 'secondary'}>
                              {item.type}
                            </Badge>
                            <Badge variant={item.status === 'pending' ? 'destructive' : 'outline'}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.reportedAt).toLocaleDateString()}
                            </span>
                            <span>Reported by: {item.reportedBy}</span>
                            <span>ID: {item.itemId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        {item.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => {
                                setModerationQueue(prev => 
                                  prev.map(m => m.id === item.id ? {...m, status: 'approved'} : m)
                                );
                                toast.success('Item approved');
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setModerationQueue(prev => 
                                  prev.map(m => m.id === item.id ? {...m, status: 'rejected'} : m)
                                );
                                toast.success('Item rejected');
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
              <CardDescription>View and manage all luxury assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {asset.metadata?.image ? (
                          <img src={asset.metadata.image} alt={asset.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{asset.name}</h3>
                        <p className="text-sm text-gray-600">{asset.symbol}</p>
                        <Badge className={getAssetTypeColor(asset.type)}>
                          {asset.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">${parseFloat(asset.currentPrice).toLocaleString()}</span>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Asset</CardTitle>
              <CardDescription>Add a new luxury asset to the marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="asset-type">Asset Type</Label>
                    <Select value={newAsset.type} onValueChange={(value) => setNewAsset({...newAsset, type: value as AssetType})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AssetType.REAL_ESTATE}>Real Estate</SelectItem>
                        <SelectItem value={AssetType.JEWELRY}>Jewelry</SelectItem>
                        <SelectItem value={AssetType.EXOTIC_CAR}>Exotic Car</SelectItem>
                        <SelectItem value={AssetType.WATCH}>Watch</SelectItem>
                        <SelectItem value={AssetType.ART}>Art</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="asset-name">Asset Name</Label>
                    <Input
                      id="asset-name"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                      placeholder="Enter asset name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="asset-price">Price (USD)</Label>
                    <Input
                      id="asset-price"
                      type="number"
                      value={newAsset.price}
                      onChange={(e) => setNewAsset({...newAsset, price: e.target.value})}
                      placeholder="Enter price"
                    />
                  </div>

                  {newAsset.type === AssetType.REAL_ESTATE && (
                    <>
                      <div>
                        <Label htmlFor="total-supply">Total Supply</Label>
                        <Input
                          id="total-supply"
                          type="number"
                          value={newAsset.totalSupply}
                          onChange={(e) => setNewAsset({...newAsset, totalSupply: e.target.value})}
                          placeholder="Enter total token supply"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newAsset.location}
                          onChange={(e) => setNewAsset({...newAsset, location: e.target.value})}
                          placeholder="Enter property location"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAsset.description}
                      onChange={(e) => setNewAsset({...newAsset, description: e.target.value})}
                      placeholder="Enter asset description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image-url">Image URL</Label>
                    <Input
                      id="image-url"
                      value={newAsset.image}
                      onChange={(e) => setNewAsset({...newAsset, image: e.target.value})}
                      placeholder="Enter image URL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="certification">Certification</Label>
                    <Input
                      id="certification"
                      value={newAsset.certification}
                      onChange={(e) => setNewAsset({...newAsset, certification: e.target.value})}
                      placeholder="Enter certification details"
                    />
                  </div>

                  <div>
                    <Label htmlFor="appraisal">Appraisal</Label>
                    <Input
                      id="appraisal"
                      value={newAsset.appraisal}
                      onChange={(e) => setNewAsset({...newAsset, appraisal: e.target.value})}
                      placeholder="Enter appraisal information"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateAsset} 
                disabled={isCreating}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? 'Creating Asset...' : 'Create Asset'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all marketplace transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Transaction history will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Admin;
