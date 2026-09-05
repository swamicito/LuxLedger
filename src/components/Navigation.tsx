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
    { href: '/list-asset', label: 'List an Asset' },
  ];

  // Debug tooling is never shown to customers on luxledger.io.
  const showDebugNav =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG_NAV === 'true';

  // Secondary nav items - grouped under "More" dropdown on desktop
  const secondaryNavItems = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/portfolio', label: t('nav.portfolio') },
    { href: '/trading', label: t('nav.trading') },
    { href: '/escrow/dashboard', label: 'Escrow' },
    { href: '/broker', label: 'LuxBroker' },
    { href: '/broker/leaderboard', label: 'Leaderboard' },
    ...(showDebugNav ? [{ href: '/broker/debugger', label: 'Debug' }] : []),
  ];

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
      className={`sticky top-0 z-50 w-full border-b transition-shadow duration-200 ${isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : ''}`}
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.92)', backdropFilter: 'blur(16px)', borderColor: 'rgba(212, 175, 55, 0.14)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16">
          {/* Logo - Fixed sizing, no layout shift */}
          <Link 
            to="/" 
            className="logo-container group min-w-0 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              <span style={{ color: 'var(--gold)' }}>Lux</span>
              <span style={{ color: 'var(--ivory)' }}>Ledger</span>
            </span>
            <span className="hidden sm:inline-flex">
              <BetaBadge variant="header" />
            </span>
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
                      className="w-full"
                      style={{ color: isActive(item.href) ? 'var(--gold)' : 'var(--ivory)' }}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {/* Desktop only - Language and Currency */}
            <div className="hidden xl:flex items-center gap-2">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
            
            {/* Wallet Connection - secondary, quiet; lives in the drawer below lg */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWalletAction}
              disabled={isConnecting}
              aria-label={account ? `Wallet connected: ${account.address?.slice(0, 6)}` : 'Connect wallet'}
              className="nav-button hidden lg:flex items-center gap-2 text-xs"
              style={{ color: 'var(--ivory)', opacity: 0.85 }}
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
                    className="nav-button hidden sm:flex items-center gap-2 hover:bg-[#D4AF37]/15"
                    aria-label="User menu"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-[#D4AF37]/20 text-xs" style={{ color: 'var(--gold)' }}>
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
              <Link to="/auth" className="shrink-0">
                <Button size="sm" className="nav-button h-9 whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm">
                  {t('auth.signIn')}
                </Button>
              </Link>
            )}

            {/* Mobile Notifications Bell */}
            {user && (
              <Link to="/notifications" className="lg:hidden">
                <Button variant="ghost" size="sm" className="tap-target relative">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full ring-2 ring-background" style={{ backgroundColor: 'var(--gold)' }}></span>
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
                className="flex h-[100dvh] w-full flex-col gap-0 overflow-hidden border-l border-white/10 bg-background p-0 sm:w-80"
                aria-describedby="mobile-menu-description"
              >
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription id="mobile-menu-description">
                    Main navigation links and account options
                  </SheetDescription>
                </VisuallyHidden>
                
                {/* Mobile menu header - fixed; body below scrolls */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 pb-4 pt-6">
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
                      <span style={{ color: 'var(--gold)' }}>Lux</span>
                      <span style={{ color: 'var(--ivory)' }}>Ledger</span>
                    </span>
                    <BetaBadge variant="header" showTooltip={false} />
                  </Link>
                  {/* Login status indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user ? 'var(--gold)' : 'rgba(248,246,240,0.35)' }}></div>
                    <span className="text-xs" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
                      {user ? 'Signed in' : 'Guest'}
                    </span>
                  </div>
                </div>

                {/* Scrollable body - clears the Android gesture bar via safe-area inset */}
                <div
                  className="min-h-0 flex-1 overflow-y-auto px-6"
                  style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
                >
                {/* Sign In first for guests - above the fold */}
                {!user && (
                  <Link to="/auth" onClick={closeMenu} className="block mt-6">
                    <Button className="w-full justify-center h-12">
                      {t('auth.signIn')}
                    </Button>
                  </Link>
                )}

                <nav className={`flex flex-col ${user ? 'mt-6' : 'mt-4'}`} role="navigation" aria-label="Mobile navigation">
                  {primaryNavItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={closeMenu}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`mobile-menu-item ${
                        isActive(item.href) ? 'mobile-menu-item-active' : 'text-[#F8F6F0]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {user && (
                  <div className="mobile-menu-section">
                    <div className="space-y-1">
                      <Link to="/account" onClick={closeMenu} className="mobile-menu-item text-[#F8F6F0]">
                        <UserCircle className="h-5 w-5" aria-hidden="true" />
                        Account
                      </Link>
                      <Link to="/notifications" onClick={closeMenu} className="mobile-menu-item text-[#F8F6F0]">
                        <Bell className="h-5 w-5" aria-hidden="true" />
                        Notifications
                      </Link>
                      <Link to="/activity" onClick={closeMenu} className="mobile-menu-item text-[#F8F6F0]">
                        <Activity className="h-5 w-5" aria-hidden="true" />
                        Activity
                      </Link>
                      <Link to="/my-listings" onClick={closeMenu} className="mobile-menu-item text-[#F8F6F0]">
                        <Package className="h-5 w-5" aria-hidden="true" />
                        My Listings
                      </Link>
                      <Link to="/settings" onClick={closeMenu} className="mobile-menu-item text-[#F8F6F0]">
                        <Settings className="h-5 w-5" aria-hidden="true" />
                        Settings
                      </Link>
                      <Link to="/help" onClick={closeMenu} className="mobile-menu-item text-[#F8F6F0]">
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
                  </div>
                )}

                {/* Secondary destinations */}
                <nav className="mobile-menu-section flex flex-col" aria-label="More navigation">
                  {secondaryNavItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={closeMenu}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`mobile-menu-item ${
                        isActive(item.href) ? 'mobile-menu-item-active' : 'text-[#F8F6F0]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Wallet (secondary) + locale/currency at the end of the scroll */}
                <div className="mobile-menu-section space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleWalletAction}
                    disabled={isConnecting}
                    className="w-full justify-center gap-3 h-12 font-medium"
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
                  <div className="flex items-center justify-between px-2 py-2 bg-white/5 rounded-lg">
                    <LanguageSwitcher />
                    <CurrencySwitcher />
                  </div>
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
