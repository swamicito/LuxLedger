import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import realEstateIcon from "@/assets/real-estate-icon.jpg";
import jewelryIcon from "@/assets/jewelry-icon.jpg";
import carsIcon from "@/assets/cars-icon.jpg";

export function AssetCategories() {
  const navigate = useNavigate();
  
  const categories = [
    {
      title: "Premium Real Estate",
      description: "Tokenized luxury properties from Manhattan penthouses to Malibu estates",
      image: realEstateIcon,
      value: "$2.4B+",
      growth: "+23%",
      items: "1,247 Properties",
      filterCategory: "real_estate"
    },
    {
      title: "Exquisite Jewelry",
      description: "Rare diamonds, vintage Rolex, and bespoke luxury pieces",
      image: jewelryIcon,
      value: "$890M+",
      growth: "+18%",
      items: "3,891 Items",
      filterCategory: "jewelry"
    },
    {
      title: "Exotic Vehicles",
      description: "Supercars, vintage classics, and limited edition automotive art",
      image: carsIcon,
      value: "$1.1B+",
      growth: "+31%",
      items: "892 Vehicles",
      filterCategory: "cars"
    }
  ];

  return (
    <section className="py-24 bg-dark-gradient">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            <span className="text-luxury-gradient">Asset Categories</span>
          </h2>
          <p className="text-xl text-muted-foreground font-inter max-w-3xl mx-auto">
            Discover tokenized luxury assets across multiple categories,
            each backed by real-world value and blockchain security
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {categories.map((category, index) => (
            <div
              key={category.title}
              className="luxury-card p-8 group hover:glow-primary transition-all duration-500"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative mb-6">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {category.growth}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-playfair font-semibold text-foreground">
                  {category.title}
                </h3>
                
                <p className="text-muted-foreground font-inter leading-relaxed">
                  {category.description}
                </p>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div>
                    <div className="text-2xl font-bold text-primary font-inter">
                      {category.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.items}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="btn-luxury-outline group-hover:bg-primary group-hover:text-primary-foreground"
                    onClick={() => navigate(`/marketplace?category=${category.filterCategory}`)}
                  >
                    Explore
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button className="btn-luxury text-lg py-6 px-12">
            View All Assets
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}