import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Clock, Users, DollarSign, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Using any for now since these are new tables not in the generated types yet
interface Auction {
  id: string;
  asset_id: string;
  starting_price: number;
  current_price: number;
  reserve_price: number;
  start_time: string;
  end_time: string;
  status: string;
  bid_increment: number;
  currency: string;
  assets: {
    title: string;
    images: string[];
  };
  bid_count: number;
}

export function AuctionManagement() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    asset_id: "",
    starting_price: "",
    reserve_price: "",
    start_time: "",
    end_time: "",
    bid_increment: "10",
    currency: "USD",
    description: ""
  });

  useEffect(() => {
    if (user) {
      fetchAuctions();
      fetchUserAssets();
    }
  }, [user]);

  const fetchAuctions = async () => {
    try {
      // For now, just show empty state until database types are regenerated
      setAuctions([]);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAuctions([]);
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
      const auctionData = {
        asset_id: formData.asset_id,
        starting_price: parseFloat(formData.starting_price),
        reserve_price: parseFloat(formData.reserve_price),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        bid_increment: parseFloat(formData.bid_increment),
        currency: formData.currency,
        description: formData.description,
        current_price: parseFloat(formData.starting_price),
        status: 'scheduled'
      };

      // Use raw insert since types aren't regenerated yet
      const { error } = await supabase
        .from('auctions' as any)
        .insert(auctionData);

      if (error) throw error;

      toast.success('Auction created successfully');
      setOpen(false);
      setFormData({
        asset_id: "",
        starting_price: "",
        reserve_price: "",
        start_time: "",
        end_time: "",
        bid_increment: "10",
        currency: "USD",
        description: ""
      });
      fetchAuctions();
    } catch (error) {
      console.error('Error creating auction:', error);
      toast.error('Failed to create auction');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
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
          <CardTitle>Auction Management</CardTitle>
          <CardDescription>Please log in to manage your auctions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Auction Management</h2>
          <p className="text-muted-foreground">Create and manage auctions for your assets</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Auction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Auction</DialogTitle>
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
                        {asset.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starting_price">Starting Price</Label>
                  <Input
                    id="starting_price"
                    type="number"
                    step="0.01"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reserve_price">Reserve Price</Label>
                  <Input
                    id="reserve_price"
                    type="number"
                    step="0.01"
                    value={formData.reserve_price}
                    onChange={(e) => setFormData({...formData, reserve_price: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bid_increment">Bid Increment</Label>
                  <Input
                    id="bid_increment"
                    type="number"
                    step="0.01"
                    value={formData.bid_increment}
                    onChange={(e) => setFormData({...formData, bid_increment: e.target.value})}
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

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Auction description and terms..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">Create Auction</Button>
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
            <Gavel className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready for Auctions!</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first auction to start selling your assets through competitive bidding.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Auction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}