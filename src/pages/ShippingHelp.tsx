/**
 * Shipping Help Page
 * 
 * Comprehensive guide to shipping and logistics on LuxLedger.
 * Uses precise trust language throughout.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Package,
  Truck,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Car,
  Gem,
  Palette,
  Wine,
  Watch,
  Home,
  HelpCircle,
  DollarSign,
  FileText,
  Lock,
} from 'lucide-react';

import { TRUST_COPY, CATEGORY_REQUIREMENTS, APPROVED_CARRIERS } from '@/modules/shipping/types';

export default function ShippingHelp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  SHIPPING GUIDE
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Logistics · Carriers · Insurance
                </p>
              </div>
            </div>
            
            {/* Center: Key Info */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Carriers</p>
                <p className="text-sm font-medium" style={{ color: '#F5F5F7' }}>{Object.keys(APPROVED_CARRIERS).length} Approved</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Insurance</p>
                <p className="text-sm font-medium" style={{ color: '#22C55E' }}>Required</p>
              </div>
            </div>
            
            {/* Right: Escrow Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <Shield className="w-4 h-4" style={{ color: '#22C55E' }} />
              <span className="text-sm" style={{ color: '#22C55E' }}>Protected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Hero Section */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80 mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">How Shipping Works on LuxLedger</h2>
              <p className="text-muted-foreground">
                {TRUST_COPY.ESCROW_LOCKED} {TRUST_COPY.SELLER_SHIPS}
              </p>
            </div>

            {/* Process Steps */}
            <div className="mt-8 grid sm:grid-cols-4 gap-4">
              {[
                { icon: Lock, title: 'Escrow Locked', desc: 'Funds secured on blockchain' },
                { icon: Package, title: 'Seller Ships', desc: 'Via approved carriers' },
                { icon: CheckCircle, title: 'You Inspect', desc: 'Within dispute window' },
                { icon: DollarSign, title: 'Funds Release', desc: 'To seller on confirmation' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-3">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust Badge */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">{TRUST_COPY.ESCROW_PROTECTED}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-neutral-900 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="buyers">For Buyers</TabsTrigger>
            <TabsTrigger value="sellers">For Sellers</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* How It Works */}
            <Card className="border border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className="text-lg">The LuxLedger Shipping Model</CardTitle>
                <CardDescription>
                  Seller-managed shipping with escrow protection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-300">Your Protection</p>
                      <p className="text-sm text-emerald-300/80 mt-1">
                        {TRUST_COPY.APPROVED_CARRIERS} {TRUST_COPY.ESCROW_PROTECTED}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">How it works:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">1</span>
                      <span>Buyer completes purchase — funds locked in blockchain escrow</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">2</span>
                      <span>Seller ships via approved carrier with tracking and insurance</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">3</span>
                      <span>LuxLedger tracks shipment status via carrier APIs</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">4</span>
                      <span>Buyer receives item and has 48-72 hours to inspect</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">5</span>
                      <span>Buyer confirms receipt OR dispute window expires → funds release</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Approved Carriers */}
            <Card className="border border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className="text-lg">Approved Carriers</CardTitle>
                <CardDescription>
                  Sellers must use approved carriers with tracking and insurance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.values(APPROVED_CARRIERS).filter(c => c.code !== 'other').map((carrier) => (
                    <div key={carrier.code} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/40">
                      <Package className="h-4 w-4 text-amber-400" />
                      <div>
                        <p className="font-medium text-sm">{carrier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Up to ${carrier.maxDeclaredValue.toLocaleString()} declared value
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Escrow Release */}
            <Card className="border border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className="text-lg">When Funds Release</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Escrow releases to the seller when ALL conditions are met:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      Tracking shows delivered
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      Buyer confirms receipt <span className="text-muted-foreground">OR</span> dispute window expires
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      No active dispute
                    </li>
                  </ul>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mt-4">
                    <p className="text-sm text-amber-300">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      If tracking shows non-delivery, escrow pauses. If buyer disputes, escrow freezes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buyers Tab */}
          <TabsContent value="buyers" className="space-y-6">
            <Card className="border border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className="text-lg">Buyer's Guide</CardTitle>
                <CardDescription>Your purchase is protected by blockchain escrow</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tracking">
                    <AccordionTrigger>How do I track my shipment?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>Once the seller ships, you'll see tracking in your Escrow Dashboard:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Real-time status updates from carrier</li>
                        <li>Estimated delivery date</li>
                        <li>Direct link to carrier tracking page</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dispute-window">
                    <AccordionTrigger>What is the dispute window?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>After delivery, you have <strong>48-72 hours</strong> (varies by category) to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Inspect the item</li>
                        <li>Verify it matches the listing</li>
                        <li>Check for damage or authenticity issues</li>
                        <li>Confirm receipt OR report an issue</li>
                      </ul>
                      <p className="mt-2 text-emerald-400">
                        <Shield className="h-4 w-4 inline mr-1" />
                        {TRUST_COPY.ESCROW_PROTECTED}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="confirm">
                    <AccordionTrigger>How do I confirm receipt?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to your Escrow Dashboard</li>
                        <li>Find the "Delivered" transaction</li>
                        <li>Complete the inspection checklist</li>
                        <li>Click "Confirm Receipt"</li>
                      </ol>
                      <p className="mt-2 text-amber-400">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Once confirmed, funds release to seller. This cannot be undone.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="issue">
                    <AccordionTrigger>What if there's a problem?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>If the item is damaged, not as described, or counterfeit:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Do NOT confirm receipt</li>
                        <li>Take photos of the issue</li>
                        <li>Click "Report Issue" in your dashboard</li>
                        <li>Submit evidence and description</li>
                      </ol>
                      <p className="mt-2 text-emerald-400">
                        <Shield className="h-4 w-4 inline mr-1" />
                        {TRUST_COPY.DISPUTE_PROTECTION}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="auto-release">
                    <AccordionTrigger>What if I don't respond?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>If you don't confirm or dispute within the window, funds automatically release to the seller.</p>
                      <p className="mt-2">This protects sellers from unresponsive buyers while giving you adequate time to inspect.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers" className="space-y-6">
            <Card className="border border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className="text-lg">Seller's Guide</CardTitle>
                <CardDescription>{TRUST_COPY.SELLER_RESPONSIBLE}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="when-ship">
                    <AccordionTrigger>When must I ship?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>You must ship within <strong>3-7 business days</strong> (varies by category).</p>
                      <p className="mt-2">Failure to ship on time may result in:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Order cancellation</li>
                        <li>Funds returned to buyer</li>
                        <li>Impact on seller rating</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="carriers">
                    <AccordionTrigger>Which carriers can I use?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>You must use an approved carrier:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>FedEx</strong> - Up to $100K declared</li>
                        <li><strong>UPS</strong> - Up to $70K declared</li>
                        <li><strong>DHL</strong> - Up to $50K declared</li>
                        <li><strong>Brink's / Malca-Amit</strong> - High-value items</li>
                        <li><strong>Enclosed Auto Transport</strong> - Vehicles</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="requirements">
                    <AccordionTrigger>What information do I provide?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>When shipping, you must provide:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Carrier name</li>
                        <li>Tracking number</li>
                        <li>Declared/insured value</li>
                        <li>Confirmation that shipment is insured</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="insurance">
                    <AccordionTrigger>Is insurance required?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p><strong>Yes.</strong> All shipments must be insured for 100% of item value.</p>
                      <p className="mt-2">You can:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Use carrier's declared value coverage</li>
                        <li>Purchase third-party shipping insurance</li>
                        <li>Use specialty carriers with built-in coverage (Brink's, Malca-Amit)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="payment">
                    <AccordionTrigger>When do I get paid?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p>Funds release to your wallet when:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Tracking shows delivered, AND</li>
                        <li>Buyer confirms receipt, OR</li>
                        <li>Dispute window expires (48-72 hours)</li>
                      </ul>
                      <p className="mt-2">Payment goes directly to your connected XRPL wallet.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="border border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className="text-lg">Shipping by Category</CardTitle>
                <CardDescription>Requirements vary by item type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Jewelry */}
                <CategoryCard
                  icon={<Gem className="h-5 w-5 text-amber-400" />}
                  title="Jewelry & Watches"
                  requirements={CATEGORY_REQUIREMENTS.jewelry}
                />

                {/* Art */}
                <CategoryCard
                  icon={<Palette className="h-5 w-5 text-purple-400" />}
                  title="Fine Art"
                  requirements={CATEGORY_REQUIREMENTS.art}
                />

                {/* Vehicles */}
                <CategoryCard
                  icon={<Car className="h-5 w-5 text-blue-400" />}
                  title="Automobiles"
                  requirements={CATEGORY_REQUIREMENTS.cars}
                />

                {/* Wine */}
                <CategoryCard
                  icon={<Wine className="h-5 w-5 text-red-400" />}
                  title="Wine & Spirits"
                  requirements={CATEGORY_REQUIREMENTS.wine}
                />

                {/* Real Estate */}
                <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Home className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-semibold">Real Estate</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Real estate transactions involve title transfer only — no physical shipping. 
                    The escrow process handles ownership documentation through our title partners.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="border border-white/10 bg-neutral-950 mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-8 w-8 text-amber-400" />
                <div>
                  <h3 className="font-semibold">Still have questions?</h3>
                  <p className="text-sm text-muted-foreground">Our support team is here to help</p>
                </div>
              </div>
              <Button onClick={() => navigate('/contact')} className="bg-amber-500 text-black hover:bg-amber-400">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoryCard({ 
  icon, 
  title, 
  requirements 
}: { 
  icon: React.ReactNode; 
  title: string; 
  requirements: typeof CATEGORY_REQUIREMENTS.jewelry;
}) {
  const carriers = requirements.approvedCarriers
    .map(code => APPROVED_CARRIERS[code]?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-2">Requirements:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Ship within {requirements.shippingSLADays} days</li>
            <li>• {requirements.disputeWindowHours}h dispute window</li>
            {requirements.requiresSignature && <li>• Signature required</li>}
            {requirements.requiresInsurance && <li>• {requirements.minInsurancePercent}% insurance required</li>}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground mb-2">Approved carriers:</p>
          <p className="text-muted-foreground">{carriers || 'Contact support'}</p>
          {requirements.handlingNotes && (
            <p className="text-xs text-amber-400/80 mt-2">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {requirements.handlingNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
