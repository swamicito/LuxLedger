import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Shield, 
  FileText,
  Briefcase,
  CreditCard,
  TrendingUp,
  Users,
  Lock,
  CheckCircle,
  Star,
  DollarSign,
  Clock,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface WhiteLabelClient {
  id: string;
  name: string;
  type: 'private_bank' | 'family_office' | 'luxury_brand';
  since: string;
  assetsUnderManagement: string;
  status: 'active' | 'setup' | 'trial';
}

interface InsuranceProvider {
  id: string;
  name: string;
  type: string;
  coverage: string[];
  rating: number;
  premium: string;
}

interface RegulatedFund {
  id: string;
  name: string;
  type: 'REIT' | 'Collectibles' | 'Mixed';
  regulation: 'SEC' | 'FCA' | 'MAS';
  minInvestment: string;
  aum: string;
  performance: string;
  status: 'open' | 'closed' | 'coming_soon';
}

export function EnterpriseServices() {
  const { user } = useAuth();
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>('white-label');

  const whiteLabelClients: WhiteLabelClient[] = [
    {
      id: "1",
      name: "Goldman Sachs Private Wealth",
      type: "private_bank",
      since: "2023",
      assetsUnderManagement: "$2.4B",
      status: "active"
    },
    {
      id: "2",
      name: "Rothschild Family Office",
      type: "family_office", 
      since: "2024",
      assetsUnderManagement: "$850M",
      status: "setup"
    },
    {
      id: "3",
      name: "LVMH Luxury Assets",
      type: "luxury_brand",
      since: "2024",
      assetsUnderManagement: "$320M",
      status: "trial"
    }
  ];

  const insuranceProviders: InsuranceProvider[] = [
    {
      id: "1",
      name: "Lloyd's of London",
      type: "Fine Art & Collectibles",
      coverage: ["Art", "Jewelry", "Watches", "Wine"],
      rating: 5,
      premium: "0.5-1.2%"
    },
    {
      id: "2",
      name: "AXA Private Insurance",
      type: "Luxury Assets",
      coverage: ["Real Estate", "Yachts", "Aircraft", "Cars"],
      rating: 4,
      premium: "0.3-0.8%"
    },
    {
      id: "3",
      name: "Chubb Collectors",
      type: "High-Value Items",
      coverage: ["Wine", "Sports Memorabilia", "Rare Books"],
      rating: 5,
      premium: "0.4-1.0%"
    }
  ];

  const regulatedFunds: RegulatedFund[] = [
    {
      id: "1",
      name: "LuxLedger Global REIT",
      type: "REIT",
      regulation: "SEC",
      minInvestment: "$250,000",
      aum: "$450M",
      performance: "+14.2%",
      status: "open"
    },
    {
      id: "2",
      name: "Elite Collectibles Fund",
      type: "Collectibles",
      regulation: "FCA",
      minInvestment: "$500,000",
      aum: "$280M", 
      performance: "+18.7%",
      status: "open"
    },
    {
      id: "3",
      name: "Asian Luxury Assets",
      type: "Mixed",
      regulation: "MAS",
      minInvestment: "$1,000,000",
      aum: "$120M",
      performance: "TBD",
      status: "coming_soon"
    }
  ];

  const handleServiceRequest = (serviceType: string) => {
    if (!user) {
      toast.error("Please sign in to request enterprise services");
      return;
    }
    toast.success(`${serviceType} request submitted. Our team will contact you within 24 hours.`);
    setActiveForm(null);
  };

  const getClientTypeIcon = (type: string) => {
    switch(type) {
      case 'private_bank': return Building2;
      case 'family_office': return Users;
      case 'luxury_brand': return Star;
      default: return Building2;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500 text-white';
      case 'setup': return 'bg-blue-500 text-white';
      case 'trial': return 'bg-yellow-500 text-white';
      case 'open': return 'bg-green-500 text-white';
      case 'closed': return 'bg-red-500 text-white';
      case 'coming_soon': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please sign in to access enterprise and institutional services.
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
            <Briefcase className="w-5 h-5" />
            Enterprise & Institutional Services
          </CardTitle>
          <p className="text-muted-foreground">
            White-label solutions, insurance partnerships, and regulated fund offerings for institutional clients
          </p>
        </CardHeader>
      </Card>

      <Tabs value={selectedService} onValueChange={setSelectedService} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="white-label">White-Label Solutions</TabsTrigger>
          <TabsTrigger value="insurance">Insurance & Escrow</TabsTrigger>
          <TabsTrigger value="regulated-funds">Regulated Funds</TabsTrigger>
        </TabsList>

        {/* White-Label Solutions */}
        <TabsContent value="white-label" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">White-Label Platform Solutions</h3>
            <Button onClick={() => setActiveForm('white-label')}>
              <Building2 className="w-4 h-4 mr-2" />
              Request Demo
            </Button>
          </div>

          {activeForm === 'white-label' && (
            <Card>
              <CardHeader>
                <CardTitle>Request White-Label Demo</CardTitle>
                <p className="text-muted-foreground">
                  Get a customized demo of our platform for your organization
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" placeholder="Enter organization name" />
                </div>
                <div>
                  <Label htmlFor="org-type">Organization Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private_bank">Private Bank</SelectItem>
                      <SelectItem value="family_office">Family Office</SelectItem>
                      <SelectItem value="luxury_brand">Luxury Brand</SelectItem>
                      <SelectItem value="wealth_management">Wealth Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="aum">Assets Under Management</Label>
                  <Input id="aum" placeholder="$0" />
                </div>
                <div>
                  <Label htmlFor="timeline">Implementation Timeline</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (1-2 weeks)</SelectItem>
                      <SelectItem value="short">Short-term (1-3 months)</SelectItem>
                      <SelectItem value="medium">Medium-term (3-6 months)</SelectItem>
                      <SelectItem value="long">Long-term (6+ months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="requirements">Specific Requirements</Label>
                  <Textarea 
                    id="requirements" 
                    placeholder="Describe your specific needs, compliance requirements, and customization preferences..."
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={() => handleServiceRequest('White-label demo')} className="flex-1">
                    Request Demo
                  </Button>
                  <Button variant="outline" onClick={() => setActiveForm(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Clients */}
          <div>
            <h4 className="font-semibold mb-4">Current Enterprise Clients</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {whiteLabelClients.map((client) => {
                const ClientIcon = getClientTypeIcon(client.type);
                return (
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <ClientIcon className="w-5 h-5 text-blue-600" />
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                      <h5 className="font-semibold mb-1">{client.name}</h5>
                      <p className="text-sm text-muted-foreground capitalize mb-2">
                        {client.type.replace('_', ' ')}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Since</p>
                          <p className="font-medium">{client.since}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">AUM</p>
                          <p className="font-medium">{client.assetsUnderManagement}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Features Grid */}
          <Card>
            <CardHeader>
              <CardTitle>White-Label Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Custom Branding</h5>
                    <p className="text-sm text-muted-foreground">Full UI customization with your brand identity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium">API Integration</h5>
                    <p className="text-sm text-muted-foreground">Seamless integration with existing systems</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Compliance Tools</h5>
                    <p className="text-sm text-muted-foreground">Built-in KYC/AML and regulatory reporting</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Multi-Currency</h5>
                    <p className="text-sm text-muted-foreground">Support for 50+ currencies and crypto</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Dedicated Support</h5>
                    <p className="text-sm text-muted-foreground">24/7 technical and business support</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium">SLA Guarantee</h5>
                    <p className="text-sm text-muted-foreground">99.9% uptime with enterprise SLA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance & Escrow */}
        <TabsContent value="insurance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Insurance & Escrow Partnerships</h3>
            <Button onClick={() => setActiveForm('insurance')}>
              <Shield className="w-4 h-4 mr-2" />
              Get Quote
            </Button>
          </div>

          {activeForm === 'insurance' && (
            <Card>
              <CardHeader>
                <CardTitle>Insurance Quote Request</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset-type">Asset Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="art">Fine Art</SelectItem>
                      <SelectItem value="jewelry">Jewelry & Watches</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="vehicles">Luxury Vehicles</SelectItem>
                      <SelectItem value="wine">Wine & Spirits</SelectItem>
                      <SelectItem value="other">Other Collectibles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="asset-value">Asset Value</Label>
                  <Input id="asset-value" placeholder="$0" />
                </div>
                <div>
                  <Label htmlFor="coverage-type">Coverage Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="transit">Transit Only</SelectItem>
                      <SelectItem value="storage">Storage Only</SelectItem>
                      <SelectItem value="exhibition">Exhibition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Coverage Duration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={() => handleServiceRequest('Insurance quote')} className="flex-1">
                    Get Quote
                  </Button>
                  <Button variant="outline" onClick={() => setActiveForm(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insurance Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insuranceProviders.map((provider) => (
              <Card key={provider.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <div className="flex">
                      {[...Array(provider.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.type}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Coverage Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.coverage.map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Premium Range</p>
                        <p className="font-semibold">{provider.premium}</p>
                      </div>
                      <Button size="sm">
                        Get Quote
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Escrow Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Automatic Escrow Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold mb-1">Smart Contracts</h4>
                  <p className="text-sm text-muted-foreground">Automated escrow release upon verified delivery</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold mb-1">Insured Custody</h4>
                  <p className="text-sm text-muted-foreground">Professional storage with full insurance coverage</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold mb-1">Title Services</h4>
                  <p className="text-sm text-muted-foreground">Automated title transfers and documentation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulated Funds */}
        <TabsContent value="regulated-funds" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Regulated Fund Offerings</h3>
            <Button onClick={() => setActiveForm('fund')}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Create Fund
            </Button>
          </div>

          {activeForm === 'fund' && (
            <Card>
              <CardHeader>
                <CardTitle>Create Regulated Fund</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fund-name">Fund Name</Label>
                  <Input id="fund-name" placeholder="Enter fund name" />
                </div>
                <div>
                  <Label htmlFor="fund-type">Fund Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reit">Real Estate Investment Trust</SelectItem>
                      <SelectItem value="collectibles">Collectibles Fund</SelectItem>
                      <SelectItem value="mixed">Mixed Asset Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="regulation">Regulatory Framework</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select regulation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sec">SEC (United States)</SelectItem>
                      <SelectItem value="fca">FCA (United Kingdom)</SelectItem>
                      <SelectItem value="mas">MAS (Singapore)</SelectItem>
                      <SelectItem value="bafin">BaFin (Germany)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="min-investment">Minimum Investment</Label>
                  <Input id="min-investment" placeholder="$0" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="fund-strategy">Investment Strategy</Label>
                  <Textarea 
                    id="fund-strategy" 
                    placeholder="Describe the fund's investment strategy, target assets, and risk profile..."
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={() => handleServiceRequest('Regulated fund')} className="flex-1">
                    Submit for Review
                  </Button>
                  <Button variant="outline" onClick={() => setActiveForm(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Funds */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regulatedFunds.map((fund) => (
              <Card key={fund.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(fund.status)}>
                      {fund.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{fund.regulation}</Badge>
                  </div>
                  <CardTitle className="text-lg">{fund.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{fund.type}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Min Investment</p>
                        <p className="font-semibold">{fund.minInvestment}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">AUM</p>
                        <p className="font-semibold">{fund.aum}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className="text-lg font-bold text-green-600">{fund.performance}</p>
                      </div>
                      <Button 
                        size="sm"
                        disabled={fund.status !== 'open'}
                      >
                        {fund.status === 'open' ? 'Invest' : 
                         fund.status === 'coming_soon' ? 'Notify Me' : 'Closed'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Regulatory Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Regulatory Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold mb-1">SEC Registered</h4>
                  <p className="text-xs text-muted-foreground">Investment Advisor</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold mb-1">FCA Authorized</h4>
                  <p className="text-xs text-muted-foreground">Fund Manager</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold mb-1">MAS Licensed</h4>
                  <p className="text-xs text-muted-foreground">Digital Assets</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-semibold mb-1">CFTC Compliant</h4>
                  <p className="text-xs text-muted-foreground">Commodity Pools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}