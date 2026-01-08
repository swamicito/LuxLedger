import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WalletConnection } from "@/components/ui/wallet-connection";
import { TokenizeAsset } from "@/components/ui/asset-tokenization";
import { NotificationsDropdown } from "@/components/ui/notifications";
import { Menu, X, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, userProfile, userRole, signOut } = useAuth();
  const location = useLocation();

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b",
        isScrolled
          ? "h-20 bg-[#0A0A0A]/90 backdrop-blur-xl border-lux-gold/20 shadow-2xl"
          : "h-24 bg-transparent border-transparent"
      )}
    >
      <div className="container h-full mx-auto px-6">
        <div className="flex items-center justify-between h-full">
          
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex-shrink-0">
              <img 
                src="/lux-logo.png" 
                alt="LuxLedger" 
                className="h-10 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: "Home", path: "/" },
                { name: "Marketplace", path: "/marketplace" },
              ].map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:text-lux-gold",
                    isActive(link.path) ? "text-lux-gold" : "text-neutral-400"
                  )}
                >
                  {link.name}
                </Link>
              ))}

              {user && (
                <>
                  <Link 
                    to="/portfolio" 
                    className={cn(
                      "text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:text-lux-gold",
                      isActive("/portfolio") ? "text-lux-gold" : "text-neutral-400"
                    )}
                  >
                    Portfolio
                  </Link>
                  <Link 
                    to="/trading" 
                    className={cn(
                      "text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:text-lux-gold",
                      isActive("/trading") ? "text-lux-gold" : "text-neutral-400"
                    )}
                  >
                    Trading
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Side: Wallet & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* These components contain your backend logic - preserving them but wrapping in style if needed */}
            <div className="flex items-center gap-3">
              <TokenizeAsset /> 
              <WalletConnection />
            </div>

            {user && <NotificationsDropdown />}
            
            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
                {userRole === 'admin' && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider hover:text-lux-gold">
                      Dashboard
                    </Button>
                  </Link>
                )}
                
                <div className="flex items-center space-x-3 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-lux-gold" />
                    <span className="hidden lg:inline font-medium text-white">
                      {userProfile?.full_name || user.email}
                    </span>
                  </div>
                  {userRole && (
                    <span className="bg-lux-gold/10 text-lux-gold px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wide border border-lux-gold/20">
                      {userRole.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border-lux-gold text-lux-gold hover:bg-lux-gold hover:text-black uppercase tracking-widest text-xs font-bold h-9">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white hover:text-lux-gold transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={cn(
            "fixed inset-0 top-20 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl transition-all duration-300 md:hidden border-t border-white/10",
            isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          )}
        >
          <div className="flex flex-col p-8 space-y-6 h-full overflow-y-auto">
            <Link to="/" className="text-2xl font-serif text-white hover:text-lux-gold transition-colors" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/marketplace" className="text-2xl font-serif text-white hover:text-lux-gold transition-colors" onClick={() => setIsMenuOpen(false)}>
              Marketplace
            </Link>
            
            {user && (
              <>
                <Link to="/portfolio" className="text-2xl font-serif text-white hover:text-lux-gold transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Portfolio
                </Link>
                <Link to="/trading" className="text-2xl font-serif text-white hover:text-lux-gold transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Trading
                </Link>
              </>
            )}

            {user && userRole === 'admin' && (
              <Link to="/dashboard" className="text-2xl font-serif text-white hover:text-lux-gold transition-colors" onClick={() => setIsMenuOpen(false)}>
                Dashboard
              </Link>
            )}

            <div className="h-px bg-white/10 w-full my-4" />

            <div className="flex flex-col space-y-4">
              {/* We pass className to these components to make them full width on mobile */}
              <div className="grid gap-4">
                <TokenizeAsset />
                <WalletConnection />
              </div>
              
              {user ? (
                <Button variant="outline" onClick={signOut} className="w-full border-red-900 text-red-500 hover:bg-red-950/30 hover:text-red-400">
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-lux-gold text-black font-bold uppercase tracking-widest">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}