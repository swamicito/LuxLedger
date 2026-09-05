import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import realEstateIcon from "@/assets/real-estate-icon.jpg";
import jewelryIcon from "@/assets/jewelry-icon.jpg";
import carsIcon from "@/assets/cars-icon.jpg";

export function AssetCategories() {
  const navigate = useNavigate();
  
  const categories = [
    {
      title: "Real Estate",
      description: "Residences and estates with verified title, held in escrow through closing.",
      image: realEstateIcon,
      filterCategory: "real_estate"
    },
    {
      title: "Jewelry & Watches",
      description: "Authenticated stones, signed pieces, and reference timepieces with papers.",
      image: jewelryIcon,
      filterCategory: "jewelry"
    },
    {
      title: "Collector Cars",
      description: "Documented provenance, inspection records, and registration handled.",
      image: carsIcon,
      filterCategory: "cars"
    }
  ];

  return (
    <section className="w-full" style={{ backgroundColor: 'var(--lux-black)' }}>
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="mb-16 text-center lg:mb-20">
          <h2
            className="mb-5 text-4xl sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ivory)' }}
          >
            The Collection
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg" style={{ color: 'var(--ivory)', opacity: 0.72 }}>
            Authenticated assets across three categories, each verified before it is listed.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {categories.map((category) => (
            <button
              key={category.title}
              type="button"
              onClick={() => navigate(`/marketplace?category=${category.filterCategory}`)}
              className="group overflow-hidden rounded-lg text-left transition-colors duration-300"
              style={{ backgroundColor: 'var(--charcoal)', border: '1px solid rgba(212,175,55,0.14)' }}
            >
              <div className="overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-8">
                <h3
                  className="mb-3 text-2xl"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ivory)' }}
                >
                  {category.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--ivory)', opacity: 0.72 }}>
                  {category.description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--gold)' }}>
                  Explore
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button onClick={() => navigate('/marketplace')} className="h-12 px-8 text-sm font-medium tracking-wide">
            Browse the Collection
          </Button>
        </div>
      </div>
    </section>
  );
}
