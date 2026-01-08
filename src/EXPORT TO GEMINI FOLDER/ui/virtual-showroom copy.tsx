import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Maximize, 
  Play, 
  Camera,
  Users,
  MapPin,
  Calendar,
  Eye,
  Hand,
  Headphones,
  Monitor,
  Smartphone,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface VRTour {
  id: string;
  title: string;
  assetType: string;
  duration: string;
  viewers: number;
  thumbnail: string;
  status: 'live' | 'upcoming' | 'recorded';
}

interface LiveAuction {
  id: string;
  title: string;
  startTime: string;
  currentBid: string;
  viewers: number;
  status: 'live' | 'upcoming' | 'ended';
}

interface MetaverseGallery {
  id: string;
  name: string;
  platform: string;
  visitors: number;
  featuredAssets: number;
  status: 'active' | 'maintenance';
}

export function VirtualShowroom() {
  const { user } = useAuth();
  const [activeVRDevice, setActiveVRDevice] = useState<'desktop' | 'mobile' | 'vr'>('desktop');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const vrTours: VRTour[] = [
    {
      id: "1",
      title: "Luxury Penthouse - Manhattan",
      assetType: "Real Estate",
      duration: "12 min",
      viewers: 847,
      thumbnail: "/api/placeholder/300/200",
      status: "live"
    },
    {
      id: "2", 
      title: "1967 Ferrari 275 GTB",
      assetType: "Automotive",
      duration: "8 min",
      viewers: 523,
      thumbnail: "/api/placeholder/300/200",
      status: "recorded"
    },
    {
      id: "3",
      title: "Patek Philippe Grand Complication",
      assetType: "Timepieces",
      duration: "15 min", 
      viewers: 312,
      thumbnail: "/api/placeholder/300/200",
      status: "upcoming"
    }
  ];

  const liveAuctions: LiveAuction[] = [
    {
      id: "1",
      title: "Rare Art Collection",
      startTime: "Live Now",
      currentBid: "$2.4M",
      viewers: 1247,
      status: "live"
    },
    {
      id: "2",
      title: "Vintage Rolex Collection", 
      startTime: "2:00 PM GMT",
      currentBid: "$850K",
      viewers: 0,
      status: "upcoming"
    }
  ];

  const metaverseGalleries: MetaverseGallery[] = [
    {
      id: "1",
      name: "LuxLedger Pavilion",
      platform: "Decentraland",
      visitors: 15600,
      featuredAssets: 47,
      status: "active"
    },
    {
      id: "2",
      name: "Premium Gallery",
      platform: "Spatial.io",
      visitors: 8900,
      featuredAssets: 32,
      status: "active"
    },
    {
      id: "3",
      name: "Collectors Lounge",
      platform: "Horizon Worlds",
      visitors: 5200,
      featuredAssets: 18,
      status: "maintenance"
    }
  ];

  const handleStartVRTour = (tourId: string) => {
    if (!user) {
      toast.error("Please sign in to access VR tours");
      return;
    }
    toast.success("Launching VR tour...");
  };

  const handleJoinLiveAuction = (auctionId: string) => {
    if (!user) {
      toast.error("Please sign in to join live auctions");
      return;
    }
    toast.success("Joining live auction...");
  };

  const handleVisitGallery = (galleryId: string) => {
    toast.success("Opening metaverse gallery...");
  };

  const getDeviceIcon = (device: string) => {
    switch(device) {
      case 'desktop': return Monitor;
      case 'mobile': return Smartphone;
      case 'vr': return Headphones;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'live': return 'bg-red-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      case 'recorded': return 'bg-gray-500 text-white';
      case 'active': return 'bg-green-500 text-white';
      case 'maintenance': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Virtual Showroom</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please sign in to access virtual showrooms, VR tours, and live auctions.
          </p>
          <Button>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Immersive Virtual Showrooms
          </CardTitle>
          <p className="text-muted-foreground">
            Experience luxury assets through AR/VR tours, live auctions, and metaverse galleries
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="vr-tours" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vr-tours">VR/AR Tours</TabsTrigger>
          <TabsTrigger value="live-auctions">Live Auctions</TabsTrigger>
          <TabsTrigger value="metaverse">Metaverse Galleries</TabsTrigger>
        </TabsList>

        {/* VR/AR Tours */}
        <TabsContent value="vr-tours" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Interactive Asset Tours</h3>
            <div className="flex items-center gap-2">
              <Label>Device:</Label>
              <div className="flex rounded-lg border">
                {['desktop', 'mobile', 'vr'].map((device) => {
                  const Icon = getDeviceIcon(device);
                  return (
                    <Button
                      key={device}
                      variant={activeVRDevice === device ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveVRDevice(device as any)}
                      className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vrTours.map((tour) => (
              <Card key={tour.id} className="group hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={tour.thumbnail} 
                    alt={tour.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className={`absolute top-2 right-2 ${getStatusColor(tour.status)}`}>
                    {tour.status}
                  </Badge>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center">
                    <Button 
                      size="lg"
                      onClick={() => handleStartVRTour(tour.id)}
                      className="bg-white/20 backdrop-blur-sm border border-white/30"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Tour
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{tour.title}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>{tour.assetType}</span>
                    <span>{tour.duration}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{tour.viewers}</span>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto">
                      <Hand className="w-4 h-4 mr-1" />
                      Try AR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Live Auctions */}
        <TabsContent value="live-auctions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live Streamed Auctions</h3>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Camera className="w-4 h-4 mr-2" />
              Host Auction
            </Button>
          </div>

          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Live Auction</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="auction-title">Auction Title</Label>
                  <Input id="auction-title" placeholder="Enter auction title" />
                </div>
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input id="start-time" type="datetime-local" />
                </div>
                <div>
                  <Label htmlFor="starting-bid">Starting Bid</Label>
                  <Input id="starting-bid" placeholder="$0.00" />
                </div>
                <div>
                  <Label htmlFor="reserve-price">Reserve Price</Label>
                  <Input id="reserve-price" placeholder="$0.00" />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button className="flex-1">Schedule Auction</Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveAuctions.map((auction) => (
              <Card key={auction.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-white/20 text-white">
                      {auction.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{auction.viewers}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg">{auction.title}</h4>
                  <p className="text-white/80">{auction.startTime}</p>
                </div>
                <CardContent className="p-4">
                  {auction.status === 'live' && (
                    <div className="bg-black rounded-lg aspect-video mb-4 flex items-center justify-center">
                      <video 
                        ref={videoRef}
                        className="w-full h-full rounded-lg"
                        poster="/api/placeholder/400/225"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button size="lg" className="bg-red-600 hover:bg-red-700">
                          <Play className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-2xl font-bold text-green-600">{auction.currentBid}</p>
                    </div>
                    <Button 
                      onClick={() => handleJoinLiveAuction(auction.id)}
                      disabled={auction.status === 'ended'}
                    >
                      {auction.status === 'live' ? 'Join Auction' : 'Set Reminder'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metaverse Galleries */}
        <TabsContent value="metaverse" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Metaverse Galleries</h3>
            <Button>
              <Globe className="w-4 h-4 mr-2" />
              Create Gallery
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metaverseGalleries.map((gallery) => (
              <Card key={gallery.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{gallery.name}</CardTitle>
                    <Badge className={getStatusColor(gallery.status)}>
                      {gallery.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{gallery.platform}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{gallery.visitors.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Visitors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{gallery.featuredAssets}</p>
                      <p className="text-xs text-muted-foreground">Assets</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleVisitGallery(gallery.id)}
                    disabled={gallery.status === 'maintenance'}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Visit Gallery
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Metaverse Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">29.7K</p>
                  <p className="text-sm text-muted-foreground">Total Visitors</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">97</p>
                  <p className="text-sm text-muted-foreground">Featured Assets</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">3</p>
                  <p className="text-sm text-muted-foreground">Active Platforms</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">$8.2M</p>
                  <p className="text-sm text-muted-foreground">Virtual Sales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}