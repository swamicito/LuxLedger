import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Users, DollarSign, TrendingUp, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface FractionalShare {
  id: string;
  asset_id: string;
  total_shares: number;
  available_shares: number;
  price_per_share: number;
  currency: string;
  minimum_investment: number;
  status: string;
  assets: {
    title: string;
    images: string[];
    estimated_value: number;
  };
}

export function FractionalOwnership() {
  const [shares, setShares] = useState<FractionalShare[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    asset_id: "",
    total_shares: "",
    price_per_share: "",
    currency: "USD",
    minimum_investment: "",
    description: ""
  });

  useEffect(() => {
    if (user) {
      fetchFractionalShares();
      fetchUserAssets();
    }
  }, [user]);

  const fetchFractionalShares = async () => {
    try {
      // For now, show empty state until types are regenerated
      setShares([]);
    } catch (error) {
      console.error('Error fetching fractional shares:', error);
      toast.error('Failed to load fractional shares');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', user?.id)
        .in('status', ['verified', 'tokenized']);

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const shareData = {
        asset_id: formData.asset_id,
        total_shares: parseInt(formData.total_shares),
        available_shares: parseInt(formData.total_shares),
        price_per_share: parseFloat(formData.price_per_share),
        currency: formData.currency,
        minimum_investment: parseFloat(formData.minimum_investment),
        status: 'active',
        description: formData.description
      };

      // Use raw insert since types aren't regenerated yet
      const { error } = await supabase
        .from('fractional_shares' as any)
        .insert(shareData);

      if (error) throw error;

      toast.success('Fractional ownership created successfully');
      setOpen(false);
      setFormData({
        asset_id: "",
        total_shares: "",
        price_per_share: "",
        currency: "USD",
        minimum_investment: "",
        description: ""
      });
      fetchFractionalShares();
    } catch (error) {
      console.error('Error creating fractional shares:', error);
      toast.error('Failed to create fractional ownership');
    }
  };

  const calculateProgress = (total: number, available: number) => {
    return ((total - available) / total) * 100;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fractional Ownership</CardTitle>
          <CardDescription>Please log in to manage fractional ownership</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fractional Ownership</h2>
          <p className="text-muted-foreground">Enable multiple investors to own shares of your assets</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Fractional Shares
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Fractional Ownership</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="asset">Asset</Label>
                <Select value={formData.asset_id} onValueChange={(value) => setFormData({...formData, asset_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.title} - {formatCurrency(asset.estimated_value || 0, 'USD')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_shares">Total Shares</Label>
                  <Input
                    id="total_shares"
                    type="number"
                    value={formData.total_shares}
                    onChange={(e) => setFormData({...formData, total_shares: e.target.value})}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_share">Price Per Share</Label>
                  <Input
                    id="price_per_share"
                    type="number"
                    step="0.01"
                    value={formData.price_per_share}
                    onChange={(e) => setFormData({...formData, price_per_share: e.target.value})}
                    placeholder="100.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum_investment">Minimum Investment</Label>
                  <Input
                    id="minimum_investment"
                    type="number"
                    step="0.01"
                    value={formData.minimum_investment}
                    onChange={(e) => setFormData({...formData, minimum_investment: e.target.value})}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full">Create Fractional Shares</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PieChart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready for Fractional Ownership!</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create fractional ownership opportunities to allow multiple investors to own shares of your assets.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Fractional Share
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}