import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CurrencySwitcher } from '@/components/ui/currency-switcher';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/hooks/use-auth';
import { Menu, Wallet, LogOut, Settings, Activity, Package, Bell, HelpCircle, UserCircle, ChevronDown, MoreHorizontal } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BetaBadge } from '@/components/ui/beta-badge';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { account, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Primary nav items - always visible
  const primaryNavItems = [
    { href: '/marketplace', label: t('nav.marketplace') },
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/portfolio', label: t('nav.portfolio') },
    { href: '/trading', label: t('nav.trading') },
  ];

  // Secondary nav items - grouped under "More" dropdown on desktop
  const secondaryNavItems = [
    { href: '/escrow/dashboard', label: 'Escrow' },
    { href: '/broker', label: 'LuxBroker' },
    { href: '/broker/leaderboard', label: 'Leaderboard' },
    { href: '/broker/debugger', label: 'Debug' },
  ];

  // All items for mobile menu
  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isActive = (href: string) => location.pathname === href;
  const isSecondaryActive = secondaryNavItems.some(item => isActive(item.href));

  const handleWalletAction = async () => {
    if (account) {
      await disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  return (
    <nav 
      className={`sticky top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 transition-shadow duration-200 ${isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* Logo - Fixed sizing, no layout shift */}
          <Link 
            to="/" 
            className="logo-container group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="LuxLedger - Go to homepage"
          >
            <img 
              src="/brand/crown-gradient.svg" 
              alt="" 
              aria-hidden="true"
              className="nav-logo transition-transform duration-200 ease-out group-hover:scale-105"
              width="32"
              height="32"
            />
            <span className="logo-text" aria-hidden="true">
              <span className="text-amber-400">Lux</span>
              <span className="text-white">Ledger</span>
            </span>
            <BetaBadge variant="header" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 ml-8" role="menubar">
            {/* Primary nav items */}
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                role="menuitem"
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}

            {/* More dropdown for secondary items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`nav-link inline-flex items-center gap-1 ${isSecondaryActive ? 'nav-link-active' : ''}`}
                  aria-label="More navigation options"
                >
                  More
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 border border-white/10 bg-neutral-950">
                {secondaryNavItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      to={item.href}
                      className={`w-full ${isActive(item.href) ? 'text-amber-400' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop only - Language and Currency */}
            <div className="hidden xl:flex items-center gap-2">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
            
            {/* Wallet Connection */}
            <Button
              variant={account ? "outline" : "default"}
              size="sm"
              onClick={handleWalletAction}
              disabled={isConnecting}
              aria-label={account ? `Wallet connected: ${account.address?.slice(0, 6)}` : 'Connect wallet'}
              className="nav-button hidden sm:flex items-center gap-2 text-xs"
            >
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              {isConnecting ? (
                <span>Connecting...</span>
              ) : account ? (
                <span className="font-mono">{account.address?.slice(0, 4)}...{account.address?.slice(-4)}</span>
              ) : (
                t('auth.connectWallet')
              )}
            </Button>

            {/* Auth Actions */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="nav-button hidden sm:flex items-center gap-2 hover:bg-amber-500/20 hover:text-amber-300"
                    aria-label="User menu"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-amber-500/20 text-amber-300 text-xs">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate text-sm">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border border-white/10 bg-neutral-950">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/activity" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Help Center
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-300">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {t('auth.signIn')}
                </Button>
              </Link>
            )}

            {/* Mobile Notifications Bell */}
            {user && (
              <Link to="/notifications" className="lg:hidden">
                <Button variant="ghost" size="sm" className="tap-target relative">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden tap-target"
                  aria-label="Open navigation menu"
                  aria-expanded={isOpen}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-80 bg-background border-l border-white/10"
                aria-describedby="mobile-menu-description"
              >
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription id="mobile-menu-description">
                    Main navigation links and account options
                  </SheetDescription>
                </VisuallyHidden>
                
                {/* Mobile menu header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <Link to="/" onClick={closeMenu} className="logo-container">
                    <img 
                      src="/brand/crown-gradient.svg" 
                      alt="" 
                      aria-hidden="true"
                      className="nav-logo"
                      width="28"
                      height="28"
                    />
                    <span className="logo-text">
                      <span className="text-amber-400">Lux</span>
                      <span className="text-white">Ledger</span>
                    </span>
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto">
                <nav className="flex flex-col mt-6" role="navigation" aria-label="Mobile navigation">
                  {allNavItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={closeMenu}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`mobile-menu-item ${
                        isActive(item.href) ? 'mobile-menu-item-active' : 'text-muted-foreground hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                  
                <div className="mobile-menu-section space-y-3 pb-8">
                  {/* Mobile - Language and Currency Switchers */}
                  <div className="flex items-center justify-between px-2 py-2 bg-white/5 rounded-lg">
                    <LanguageSwitcher />
                    <CurrencySwitcher />
                  </div>
                  <Button
                    variant={account ? "outline" : "default"}
                    onClick={handleWalletAction}
                    disabled={isConnecting}
                    className="w-full justify-center gap-3 h-12 bg-amber-500 hover:bg-amber-400 text-black font-medium"
                    aria-label={account ? 'Disconnect wallet' : 'Connect wallet'}
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    {isConnecting ? (
                      <span>Connecting...</span>
                    ) : account ? (
                      <span>{account.address?.slice(0, 6)}...{account.address?.slice(-4)}</span>
                    ) : (
                      t('auth.connectWallet')
                    )}
                  </Button>

                  {user ? (
                    <div className="space-y-1 mt-2">
                      <Link to="/account" onClick={closeMenu} className="mobile-menu-item text-muted-foreground hover:text-white">
                        <UserCircle className="h-5 w-5" aria-hidden="true" />
                        Account
                      </Link>
                      <Link to="/notifications" onClick={closeMenu} className="mobile-menu-item text-muted-foreground hover:text-white">
                        <Bell className="h-5 w-5" aria-hidden="true" />
                        Notifications
                      </Link>
                      <Link to="/activity" onClick={closeMenu} className="mobile-menu-item text-muted-foreground hover:text-white">
                        <Activity className="h-5 w-5" aria-hidden="true" />
                        Activity
                      </Link>
                      <Link to="/my-listings" onClick={closeMenu} className="mobile-menu-item text-muted-foreground hover:text-white">
                        <Package className="h-5 w-5" aria-hidden="true" />
                        My Listings
                      </Link>
                      <Link to="/settings" onClick={closeMenu} className="mobile-menu-item text-muted-foreground hover:text-white">
                        <Settings className="h-5 w-5" aria-hidden="true" />
                        Settings
                      </Link>
                      <Link to="/help" onClick={closeMenu} className="mobile-menu-item text-muted-foreground hover:text-white">
                        <HelpCircle className="h-5 w-5" aria-hidden="true" />
                        Help Center
                      </Link>
                      <button
                        onClick={() => { signOut(); closeMenu(); }}
                        className="mobile-menu-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                        {t('auth.signOut')}
                      </button>
                    </div>
                  ) : (
                    <Link to="/auth" onClick={closeMenu}>
                      <Button variant="outline" className="w-full justify-center h-12 mt-2">
                        {t('auth.signIn')}
                      </Button>
                    </Link>
                  )}
                </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
