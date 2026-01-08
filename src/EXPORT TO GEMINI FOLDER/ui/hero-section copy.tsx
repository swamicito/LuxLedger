import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-luxury.jpg";

export function HeroSection() {
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
                  className="text-lg py-3 px-6 border-2 hover:bg-white/10"
                  style={{ 
                    borderColor: 'var(--gold)', 
                    color: 'var(--gold)',
                    backgroundColor: 'transparent'
                  }}
                >
                  How It Works
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}