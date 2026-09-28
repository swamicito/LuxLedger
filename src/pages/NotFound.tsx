import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0B0B0C' }}
    >
      <div className="text-center px-6">
        <img
          src="/brand/crown-gradient.svg"
          alt="LuxLedger"
          className="mx-auto mb-8 h-16 w-16"
        />
        <h1
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)' }}
        >
          404
        </h1>
        <p className="text-xl mb-6" style={{ color: 'var(--ivory)', opacity: 0.72 }}>
          This page doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors"
          style={{ backgroundColor: '#D4AF37', color: '#0A0A0A' }}
        >
          Return to LuxLedger
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
