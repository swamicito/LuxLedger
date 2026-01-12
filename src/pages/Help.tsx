import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  HelpCircle,
  ChevronLeft,
  ShieldCheck,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Search,
  MessageSquare,
  Mail,
  ExternalLink,
  BookOpen,
  Scale,
  Clock,
  Lock,
  Gem,
  ArrowRight,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    category: "escrow",
    question: "How does escrow work on LuxLedger?",
    answer: "When you purchase an asset, your funds are held in a secure XRPL escrow account—not by LuxLedger or the seller. The escrow is released only when you confirm receipt of the asset, or automatically after a set period if no dispute is raised. This protects both buyers and sellers in high-value transactions.",
  },
  {
    category: "escrow",
    question: "What happens if there's a dispute?",
    answer: "If you receive an asset that doesn't match the listing, you can open a dispute within 48 hours of delivery confirmation. Our resolution team will review evidence from both parties and make a binding decision. If the dispute is found in your favor, funds are returned to you. If not, they're released to the seller.",
  },
  {
    category: "escrow",
    question: "How long does escrow take?",
    answer: "Escrow is funded instantly on the XRPL. Release typically happens within 24-48 hours of delivery confirmation. If you don't confirm within 7 days and no dispute is raised, funds are automatically released to the seller.",
  },
  {
    category: "verification",
    question: "How are assets verified?",
    answer: "Every asset listed on LuxLedger goes through a multi-step verification process: 1) Document review (certificates, provenance, receipts), 2) Photo analysis by category experts, 3) Third-party authentication for high-value items, 4) Blockchain provenance recording. Only verified assets appear on the marketplace.",
  },
  {
    category: "verification",
    question: "What is KYC and why is it required?",
    answer: "Know Your Customer (KYC) verification confirms your identity using government-issued documents. It's required for regulatory compliance, fraud prevention, and to build trust in the marketplace. Your data is encrypted and never shared with other users.",
  },
  {
    category: "verification",
    question: "How long does verification take?",
    answer: "KYC verification typically takes 1-3 business days. Asset verification depends on the category and value: standard items take 2-5 days, while high-value pieces requiring third-party authentication may take 1-2 weeks.",
  },
  {
    category: "fees",
    question: "What are the trading fees?",
    answer: "LuxLedger charges a 2.5% platform fee on completed sales, paid by the seller. Buyers pay no platform fees. Escrow services add a 1% fee split between buyer and seller. XRPL network fees are minimal (fractions of a cent).",
  },
  {
    category: "fees",
    question: "Are there listing fees?",
    answer: "Listing assets is free. You only pay fees when a sale is completed. Premium placement and featured listings are available for a monthly subscription.",
  },
  {
    category: "fees",
    question: "How do broker commissions work?",
    answer: "Brokers earn commission on sales they refer. Standard commission is 1-3% depending on broker tier. Commissions are paid from the platform fee, not added to the buyer's cost. Payouts are processed weekly.",
  },
  {
    category: "security",
    question: "Is my wallet safe?",
    answer: "LuxLedger never has access to your private keys. We use XUMM for wallet connections, which means you sign every transaction on your own device. Your funds remain in your control at all times.",
  },
  {
    category: "security",
    question: "What if a deal falls through?",
    answer: "If a deal fails before escrow is funded, nothing happens—no money moves. If escrow is funded but the seller can't deliver, you can request a refund through our dispute process. Funds are returned within 3-5 business days.",
  },
  {
    category: "security",
    question: "How is my data protected?",
    answer: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). KYC documents are stored in isolated, compliant systems. We never sell your data. You can request data deletion at any time.",
  },
];

const categories = [
  { id: "escrow", label: "Escrow", icon: ShieldCheck },
  { id: "verification", label: "Verification", icon: CheckCircle },
  { id: "fees", label: "Fees", icon: DollarSign },
  { id: "security", label: "Security", icon: Lock },
];

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFAQs = faqItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === null || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Message received. We'll be in touch within 24 hours.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  HELP CENTER
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  FAQs · Support · Contact
                </p>
              </div>
            </div>
            
            {/* Center: Categories */}
            <div className="hidden md:flex items-center gap-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`text-xs uppercase tracking-wider transition-colors ${
                    activeCategory === cat.id ? '' : 'hover:text-white'
                  }`}
                  style={{ color: activeCategory === cat.id ? '#D4AF37' : '#6B7280' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm" style={{ color: '#22C55E' }}>Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">

        {/* Hero Section */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold sm:text-2xl">How can we help you?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Find answers to common questions or contact our support team.
              </p>
              <div className="relative mx-auto mt-6 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "How Escrow Works", desc: "Secure transactions", link: "#escrow" },
            { icon: CheckCircle, title: "Verification Process", desc: "Asset authentication", link: "#verification" },
            { icon: DollarSign, title: "Fees Explained", desc: "Transparent pricing", link: "#fees" },
            { icon: AlertTriangle, title: "Dispute Resolution", desc: "Problem solving", link: "#disputes" },
          ].map((item, i) => (
            <Card
              key={i}
              className="group cursor-pointer border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80 transition-colors hover:border-amber-500/30"
              onClick={() => {
                setActiveCategory(item.link.replace("#", ""));
                document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300 transition-colors group-hover:bg-amber-500/20">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div id="faq-section">
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-base font-semibold">Frequently Asked Questions</CardTitle>
                </div>
                {activeCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveCategory(null)}
                  >
                    Clear filter
                  </Button>
                )}
              </div>

              {/* Category filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className={`text-xs ${
                      activeCategory === cat.id
                        ? "bg-amber-500 text-black hover:bg-amber-400"
                        : ""
                    }`}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  >
                    <cat.icon className="mr-1.5 h-3 w-3" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {filteredFAQs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border-white/10"
                    >
                      <AccordionTrigger className="text-left text-sm hover:no-underline [&[data-state=open]]:text-amber-300">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 text-amber-400"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory(null);
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Key Information Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* How Escrow Works */}
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm font-semibold">How Escrow Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {[
                  { step: 1, title: "Buyer initiates purchase", desc: "Funds are sent to XRPL escrow" },
                  { step: 2, title: "Seller ships asset", desc: "Tracking provided to buyer" },
                  { step: 3, title: "Buyer confirms receipt", desc: "Inspects and approves asset" },
                  { step: 4, title: "Escrow releases", desc: "Funds transferred to seller" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 pl-0">
                    <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-300">
                      {item.step}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-xs text-emerald-300">
                  <Lock className="mr-1.5 inline h-3 w-3" />
                  Your funds are never held by LuxLedger—only by the XRPL blockchain.
                </p>
              </div>
              <Button
                variant="link"
                className="mt-3 h-auto p-0 text-xs text-amber-400 hover:text-amber-300"
                onClick={() => navigate("/escrow/dashboard")}
              >
                View your escrow dashboard →
              </Button>
            </CardContent>
          </Card>

          {/* Verification Standards */}
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2">
                <Gem className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm font-semibold">Verification Standards</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[
                  { icon: CheckCircle, title: "Document Review", desc: "Certificates, receipts, provenance" },
                  { icon: Search, title: "Expert Analysis", desc: "Category specialists review photos" },
                  { icon: ShieldCheck, title: "Third-Party Auth", desc: "Independent verification for high-value" },
                  { icon: Scale, title: "Blockchain Record", desc: "Immutable provenance on XRPL" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pl-0">
                    <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5">
                      <item.icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[0.6rem]">
                  <Clock className="mr-1 h-2.5 w-2.5" />
                  2-5 days typical
                </Badge>
                <Badge variant="outline" className="text-[0.6rem]">
                  100% verified listings
                </Badge>
              </div>
              <Button
                variant="link"
                className="mt-3 h-auto p-0 text-xs text-amber-400 hover:text-amber-300"
                onClick={() => navigate("/list-asset")}
              >
                List your first asset →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-base font-semibold">Contact Support</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Can't find what you're looking for? Our team typically responds within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-[0.18em]">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    className="bg-black/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-black/40"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs uppercase tracking-[0.18em]">
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  className="min-h-[120px] bg-black/40"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] hover:bg-amber-400 sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@luxledger.io" className="hover:text-amber-400">
                  support@luxledger.io
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Response within 24h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Button
            variant="link"
            className="text-muted-foreground hover:text-amber-400"
            onClick={() => navigate("/terms")}
          >
            Terms of Service
          </Button>
          <Button
            variant="link"
            className="text-muted-foreground hover:text-amber-400"
            onClick={() => navigate("/privacy")}
          >
            Privacy Policy
          </Button>
          <Button
            variant="link"
            className="text-muted-foreground hover:text-amber-400"
            onClick={() => window.open("https://xrpl.org", "_blank")}
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            XRPL Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
