import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Shield, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-luxury.jpg";

export function HeroSection() {
  const navigate = useNavigate();
  // How It Works is always visible now

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--lux-black)', opacity: 0.8 }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Side - Crown Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/brand/crown-gradient.svg" 
                alt="LuxLedger Crown" 
                className="w-18 h-18 lg:w-20 lg:h-20"
              />
            </div>

            {/* Center - Main Content */}
            <div className="text-center lg:text-left flex-1">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--ivory)' }}>
                LUXLEDGER
              </h1>
              
              <p className="text-xl md:text-2xl mb-8" style={{ fontFamily: 'var(--font-ui)', color: 'var(--ivory)' }}>
                Luxury, verified. Ownership in seconds.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="btn-gold text-lg py-3 px-6">
                  Browse the Collection
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                                <Button
                  variant="outline"
                  onClick={() => navigate("/list-asset")}
                  className="text-lg py-3 px-6 border-2 hover:bg-white/10"
                  style={{
                    borderColor: 'var(--gold)',
                    color: 'var(--gold)',
                    backgroundColor: 'transparent'
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  List an Asset
                </Button>
              </div>

                          </div>

          </div>

          {/* How It Works Section - Always visible */}
          <div className="mt-16">
            <HowItWorksSection />
          </div>
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