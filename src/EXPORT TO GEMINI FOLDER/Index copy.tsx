import { HeroSection } from "@/components/ui/hero-section";
import { AssetCategories } from "@/components/ui/asset-categories";
import { StatsSection } from "@/components/ui/stats-section";
import { Footer } from "@/components/ui/footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <AssetCategories />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
