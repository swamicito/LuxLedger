import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletConnection } from "@/components/ui/wallet-connection";
import { TokenizeAsset } from "@/components/ui/asset-tokenization";
import { NotificationsDropdown } from "@/components/ui/notifications";
import { Menu, X, User, LogOut, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userProfile, userRole, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Gem className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">LuxLedger</span>
            </Link>

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              <Link 
                to="/" 
                className="text-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/marketplace" 
                className="text-foreground hover:text-primary transition-colors"
              >
                Marketplace
              </Link>
              {user && (
                <>
                  <Link 
                    to="/portfolio" 
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    Portfolio
                  </Link>
                  <Link 
                    to="/trading" 
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    Trading
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Wallet Connection & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <TokenizeAsset />
            <WalletConnection />
            {user && <NotificationsDropdown />}
            {user ? (
              <div className="flex items-center space-x-2">
                {userRole === 'admin' && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">
                    {userProfile?.full_name || user.email}
                  </span>
                  {userRole && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {userRole.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isMenuOpen ? "max-h-96 pb-6" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-4">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/marketplace" className="text-foreground hover:text-primary transition-colors">
              Marketplace
            </Link>
            {user && (
              <>
                <Link to="/portfolio" className="text-foreground hover:text-primary transition-colors">
                  Portfolio
                </Link>
                <Link to="/trading" className="text-foreground hover:text-primary transition-colors">
                  Trading
                </Link>
              </>
            )}
            {user && userRole === 'admin' && (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
            <div className="flex flex-col space-y-3 mt-4">
              <TokenizeAsset className="w-full" />
              <WalletConnection className="w-full" />
              {user ? (
                <Button variant="outline" onClick={signOut} className="w-full">
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
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