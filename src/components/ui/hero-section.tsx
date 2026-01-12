import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Shield, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-luxury.jpg";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Crown Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/brand/crown-gradient.svg" 
              alt="LuxLedger" 
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
          </div>

          {/* Main headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'Playfair Display, serif', color: '#F5F5F7' }}>
            <span>The marketplace for </span>
            <span style={{ color: '#D4AF37' }}>tokenized luxury</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ color: '#9CA3AF' }}>
            Buy, sell, and trade authenticated luxury assets with secure blockchain escrow. 
            Real estate, fine art, jewelry, and exotic cars.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button 
              onClick={() => navigate("/marketplace")}
              className="h-11 px-6 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black"
            >
              Explore Marketplace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/list-asset")}
              className="h-11 px-6 text-sm font-medium border-white/20 hover:bg-white/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              List an Asset
            </Button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>Escrow Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>Expert Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>48hr Disputes</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Now in normal flow */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <HowItWorksSection />
      </div>
    </section>
  );
}

/**
 * How It Works - Plain English explanation
 */
function HowItWorksSection() {
  const steps = [
    {
      icon: CheckCircle,
      title: "1. Browse & Verify",
      description: "Every luxury item is authenticated by independent experts before listing. No fakes, no guesswork.",
    },
    {
      icon: Shield,
      title: "2. Escrow Protection",
      description: "When you buy, your funds are held in blockchain escrow—not by us. Money only releases when you confirm delivery.",
    },
    {
      icon: Clock,
      title: "3. Secure Transfer",
      description: "Ownership transfers instantly on the blockchain. If anything goes wrong, our dispute team resolves it within 48-72 hours.",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-8">
      <h3 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--ivory)' }}>
        How LuxLedger Protects You
      </h3>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
        Your funds are held in blockchain escrow, not by us. Here's how it works:
      </p>
      
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div key={i} className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-4">
              <step.icon className="h-6 w-6 text-amber-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--ivory)' }}>
              {step.title}
            </h4>
            <p className="text-sm" style={{ color: 'var(--ivory)', opacity: 0.8 }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Trust statement */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-xs" style={{ color: 'var(--ivory)', opacity: 0.6 }}>
          <Shield className="inline h-3 w-3 mr-1" />
          Funds are held in blockchain escrow, not by LuxLedger. Verified by independent authentication.
        </p>
      </div>
    </div>
  );
}