import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gavel, 
  PieChart, 
  Globe, 
  Brain, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Settings,
  BarChart3,
  ArrowRightLeft,
  Code,
  Vote,
  MessageCircle,
  Eye,
  Building
} from "lucide-react";
import { AuctionManagement } from "@/components/ui/auction-management";
import { FractionalOwnership } from "@/components/ui/fractional-ownership";
import { RegionalMarketplace } from "@/components/ui/regional-marketplace";
import { AIRecommendations } from "@/components/ui/ai-recommendations";
import { CrossChainBridge } from "@/components/ui/cross-chain-bridge";
import { DeveloperSDK } from "@/components/ui/developer-sdk";
import { DAOGovernance } from "@/components/ui/dao-governance";
import { AIPricingEngine } from "@/components/ui/ai-pricing-engine";
import { AIConcierge } from "@/components/ui/ai-concierge";
import { VirtualShowroom } from "@/components/ui/virtual-showroom";
import { EnterpriseServices } from "@/components/ui/enterprise-services";
import { Navigation } from "@/components/ui/navigation";
import { StatsSection } from "@/components/ui/stats-section";
import { useAuth } from "@/hooks/use-auth";

export default function AdvancedFeatures() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();

  const features = [
    {
      id: "auctions",
      title: "Advanced Auctions",
      description: "Create competitive bidding experiences",
      icon: Gavel,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      component: AuctionManagement
    },
    {
      id: "fractional",
      title: "Fractional Ownership",
      description: "Enable shared asset investment",
      icon: PieChart,
      color: "text-green-500",
      bgColor: "bg-green-50",
      component: FractionalOwnership
    },
    {
      id: "regional",
      title: "Global Marketplace",
      description: "Worldwide asset discovery",
      icon: Globe,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      component: RegionalMarketplace
    },
    {
      id: "ai",
      title: "AI Recommendations",
      description: "Personalized asset suggestions",
      icon: Brain,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      component: AIRecommendations
    },
    {
      id: "bridge",
      title: "Cross-Chain Bridge",
      description: "Multi-blockchain asset support",
      icon: ArrowRightLeft,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      component: CrossChainBridge
    },
    {
      id: "sdk",
      title: "Developer APIs",
      description: "REST, GraphQL & SDK integration",
      icon: Code,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      component: DeveloperSDK
    },
    {
      id: "dao",
      title: "DAO Governance",
      description: "Community-driven platform decisions",
      icon: Vote,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      component: DAOGovernance
    },
    {
      id: "pricing",
      title: "AI Pricing Engine",
      description: "Dynamic price recommendations",
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      component: AIPricingEngine
    },
    {
      id: "concierge",
      title: "AI Concierge",
      description: "Virtual assistant & expert handoff",
      icon: MessageCircle,
      color: "text-violet-500",
      bgColor: "bg-violet-50",
      component: AIConcierge
    },
    {
      id: "virtual",
      title: "Virtual Showrooms",
      description: "AR/VR tours & live auctions",
      icon: Eye,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
      component: VirtualShowroom
    },
    {
      id: "enterprise",
      title: "Enterprise Services",
      description: "White-label & institutional solutions",
      icon: Building,
      color: "text-slate-500",
      bgColor: "bg-slate-50",
      component: EnterpriseServices
    }
  ];

  const stats = [
    {
      title: "Global Regions",
      value: "8",
      change: "+2 this month",
      icon: Globe,
      color: "text-blue-500"
    },
    {
      title: "Active Auctions",
      value: "24",
      change: "+12 this week",
      icon: Gavel,
      color: "text-green-500"
    },
    {
      title: "Fractional Assets",
      value: "156",
      change: "+23% growth",
      icon: PieChart,
      color: "text-purple-500"
    },
    {
      title: "AI Accuracy",
      value: "94%",
      change: "+3% improvement",
      icon: Target,
      color: "text-orange-500"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please log in to access advanced marketplace features.
              </p>
              <Button className="w-full" asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Advanced Marketplace Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the next generation of luxury asset trading with AI-powered recommendations, 
              global reach, advanced auctions, and fractional ownership opportunities.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 lg:w-max lg:mx-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              {features.map((feature) => (
                <TabsTrigger key={feature.id} value={feature.id} className="flex items-center gap-2">
                  <feature.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{feature.title.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-green-600">{stat.change}</p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => (
                  <Card key={feature.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        onClick={() => setActiveTab(feature.id)}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${feature.bgColor} group-hover:scale-110 transition-transform`}>
                          <feature.icon className={`w-6 h-6 ${feature.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Active</Badge>
                        <Button variant="ghost" size="sm">
                          Explore →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Platform Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">$2.4M</div>
                      <div className="text-sm text-muted-foreground">Total Auction Volume</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">89%</div>
                      <div className="text-sm text-muted-foreground">Successful Fractionalization</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">47</div>
                      <div className="text-sm text-muted-foreground">Countries Reached</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {features.map((feature) => (
              <TabsContent key={feature.id} value={feature.id}>
                <feature.component />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}