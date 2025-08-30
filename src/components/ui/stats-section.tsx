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
    { label: "Total Value Locked", value: "$4.2B+", prefix: "" },
    { label: "Active Traders", value: "12,847", prefix: "" },
    { label: "Assets Tokenized", value: "6,030", prefix: "" },
    { label: "Countries Served", value: "47", prefix: "" }
  ];

  const CountingNumber = ({ target, prefix }: { target: string; prefix: string }) => {
    const [count, setCount] = useState(0);
    const numericTarget = parseInt(target.replace(/[^\d]/g, ''));

    useEffect(() => {
      if (!isVisible) return;

      const increment = numericTarget / 100;
      const timer = setInterval(() => {
        setCount(prev => {
          if (prev >= numericTarget) {
            clearInterval(timer);
            return numericTarget;
          }
          return Math.min(prev + increment, numericTarget);
        });
      }, 20);

      return () => clearInterval(timer);
    }, [isVisible, numericTarget]);

    const formatNumber = (num: number) => {
      if (target.includes('B')) return `$${(num / 1000).toFixed(1)}B+`;
      if (target.includes(',')) return num.toLocaleString();
      return num.toString();
    };

    return (
      <span className="text-4xl md:text-5xl font-bold text-primary font-inter">
        {formatNumber(Math.floor(count))}
      </span>
    );
  };

  return (
    <section id="stats-section" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            <span className="text-luxury-gradient">Trusted by Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground font-inter">
            Join the world's premier marketplace for tokenized luxury assets
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center luxury-card p-8"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CountingNumber target={stat.value} prefix={stat.prefix} />
              <p className="text-muted-foreground mt-2 font-inter font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}