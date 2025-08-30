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
import { Plus, Upload, Eye, Edit, Trash2 } from 'lucide-react';

const Admin = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">LuxLedger Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage luxury assets and marketplace operations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="create">Create Asset</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          </div>
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
  );
};

export default Admin;
