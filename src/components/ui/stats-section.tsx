import { useEffect, useState } from "react";

export function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const stats = [
    { label: "Settlement", value: "On-chain escrow" },
    { label: "Custody", value: "Non-custodial" },
    { label: "Release", value: "Delivery-confirmed" },
    { label: "Records", value: "On-chain" }
  ];

  const StatValue = ({ value }: { value: string }) => (
    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary font-inter">
      {value}
    </span>
  );

  return (
    <section id="stats-section" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            <span className="text-luxury-gradient">Settlement You Can Verify</span>
          </h2>
          <p className="text-xl text-muted-foreground font-inter">
            Real luxury assets — funds held in on-chain escrow until delivery is confirmed
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center luxury-card p-4 sm:p-6 md:p-8"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <StatValue value={stat.value} />
              <p className="text-muted-foreground mt-1 sm:mt-2 font-inter font-medium text-xs sm:text-sm md:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}