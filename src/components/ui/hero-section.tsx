import { Button } from "@/components/ui/button";
import { Shield, BadgeCheck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-luxury.jpg";

const GOLD_PATTERN =
  "repeating-linear-gradient(135deg, rgba(212,175,55,0.045) 0px, rgba(212,175,55,0.045) 1px, transparent 1px, transparent 28px)";

export function HeroSection() {
  const navigate = useNavigate();

  const trust = [
    { icon: Shield, label: "Escrow held until delivery" },
    { icon: BadgeCheck, label: "Independent verification" },
    { icon: Clock, label: "Clear dispute window" },
  ];

  return (
    <>
      {/* Hero - background spans the full viewport; content is constrained */}
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: "var(--lux-black)" }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.18]"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ backgroundImage: GOLD_PATTERN }} aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(212,175,55,0.10) 0%, rgba(10,10,10,0) 60%), linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.85) 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-24 pt-24 sm:pb-32 sm:pt-32 lg:px-8 lg:pb-40 lg:pt-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-10 flex justify-center">
              <img src="/brand/crown-gradient.svg" alt="LuxLedger" className="h-14 w-14 sm:h-16 sm:w-16" />
            </div>

            <h1
              className="mb-8 text-5xl leading-[1.02] tracking-[-0.01em] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ivory)" }}
            >
              Luxury, verified.
              <br />
              Ownership in seconds.
            </h1>

            <p
              className="mx-auto mb-12 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--ivory)", opacity: 0.82 }}
            >
              Authenticated real estate, jewelry, watches, and collector cars.
              <br className="hidden sm:block" />
              {" "}Funds stay in escrow until delivery is confirmed.
            </p>

            <div className="mb-16 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                onClick={() => navigate("/marketplace")}
                className="h-12 px-8 text-sm font-medium tracking-wide"
              >
                Browse the Collection
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/list-asset")}
                className="h-12 px-8 text-sm font-medium tracking-wide"
              >
                Apply to List
              </Button>
            </div>

            {/* Trust row - ivory / muted gold only */}
            <div
              className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row sm:gap-10"
              style={{ borderTop: "1px solid rgba(212,175,55,0.18)" }}
            >
              {trust.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" style={{ color: "var(--gold)", opacity: 0.8 }} aria-hidden="true" />
                  <span className="text-sm" style={{ color: "var(--ivory)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HowOwnershipMoves />
    </>
  );
}

/**
 * How ownership moves - full-bleed charcoal band with hairline gold rules.
 */
function HowOwnershipMoves() {
  const columns = [
    {
      title: "Verified before it is listed",
      body: "Every asset is authenticated before it goes live. The object is real. The record should be too.",
    },
    {
      title: "Funds held in escrow",
      body: "You do not wire into a void. Payment is held until delivery is confirmed. No release while a dispute is open.",
    },
    {
      title: "Proof that travels with the asset",
      body: "You get a verifiable ownership record plus the documents the real world still requires. Title, bill of sale, registration — handled, not hand-waved.",
    },
  ];

  return (
    <section
      className="w-full"
      style={{
        backgroundColor: "var(--charcoal)",
        borderTop: "1px solid rgba(212,175,55,0.22)",
        borderBottom: "1px solid rgba(212,175,55,0.22)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <h2
          className="mb-16 text-center text-4xl sm:text-5xl lg:mb-20"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ivory)" }}
        >
          How ownership moves
        </h2>

        <div className="grid gap-12 md:grid-cols-3 md:gap-10 lg:gap-16">
          {columns.map((col, i) => (
            <div key={col.title}>
              <div className="mb-6 flex items-center gap-4">
                <span
                  className="text-xs font-medium tracking-[0.2em]"
                  style={{ color: "var(--gold)" }}
                >
                  0{i + 1}
                </span>
                <span className="h-px flex-1" style={{ backgroundColor: "rgba(212,175,55,0.25)" }} aria-hidden="true" />
              </div>
              <h3
                className="mb-4 text-2xl leading-snug"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ivory)" }}
              >
                {col.title}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--ivory)", opacity: 0.78 }}>
                {col.body}
              </p>
            </div>
          ))}
        </div>

        <p
          className="mx-auto mt-20 max-w-2xl text-center text-sm leading-relaxed"
          style={{ color: "var(--ivory)", opacity: 0.62 }}
        >
          LuxLedger does not take possession of the asset. We orchestrate verification, escrow, and proof.
        </p>
      </div>
    </section>
  );
}
