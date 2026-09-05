import { HeroSection } from "@/components/ui/hero-section";
import { AssetCategories } from "@/components/ui/asset-categories";
import { Footer } from "@/components/ui/footer";

const Index = () => {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--lux-black)' }}>
      <main>
        <HeroSection />
        <AssetCategories />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
