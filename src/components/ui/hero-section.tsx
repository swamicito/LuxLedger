import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Shield, CheckCircle, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-luxury.jpg";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ backgroundColor: 'var(--charcoal)' }}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
      
      {/* Background Image with better treatment */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Content */}
      <div className="relative z-10 full-width-mobile w-full py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: 'var(--gold-subtle)', border: '1px solid var(--gold-muted)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>Blockchain-Verified Luxury Assets</span>
          </div>

          {/* Main headline */}
          <h1 className="heading-1 mb-6">
            <span style={{ color: 'var(--ivory)' }}>The marketplace for </span>
            <span style={{ color: 'var(--gold)' }}>tokenized luxury</span>
          </h1>
          
          {/* Subheadline */}
          <p className="body-large max-w-2xl mx-auto mb-10" style={{ color: 'var(--silver)' }}>
            Buy, sell, and trade authenticated luxury assets with secure blockchain escrow. 
            Real estate, fine art, jewelry, and exotic cars—verified and protected.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/marketplace")}
              className="btn-primary text-base h-12 px-8"
            >
              Explore Marketplace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/list-asset")}
              className="btn-secondary text-base h-12 px-8"
            >
              <Plus className="w-4 h-4 mr-2" />
              List an Asset
            </Button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#22C55E' }} />
              <span className="text-sm" style={{ color: 'var(--silver)' }}>Escrow Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#22C55E' }} />
              <span className="text-sm" style={{ color: 'var(--silver)' }}>Expert Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#22C55E' }} />
              <span className="text-sm" style={{ color: 'var(--silver)' }}>48hr Dispute Resolution</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="full-width-mobile pb-8">
          <HowItWorksSection />
        </div>
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