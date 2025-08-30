import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CurrencySwitcher } from '@/components/ui/currency-switcher';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/hooks/use-auth';
import { Menu, Wallet, LogOut } from 'lucide-react';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { account, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/marketplace', label: t('nav.marketplace') },
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/portfolio', label: t('nav.portfolio') },
    { href: '/trading', label: t('nav.trading') },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleWalletAction = async () => {
    if (account) {
      await disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/src/assets/luxledger-logo.svg" 
              alt="LuxLedger Crown" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">LuxLedger</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop only - Language and Currency */}
            <div className="hidden lg:flex items-center space-x-4">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
            
            {/* Wallet Connection */}
            <Button
              variant={account ? "outline" : "default"}
              size="sm"
              onClick={handleWalletAction}
              className="hidden sm:flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {account ? (
                <span>{account.address?.slice(0, 6)}...{account.address?.slice(-4)}</span>
              ) : (
                t('auth.connectWallet')
              )}
            </Button>

            {/* Auth Actions */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hidden sm:flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.signOut')}
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {t('auth.signIn')}
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  <div className="pt-4 border-t space-y-4">
                    {/* Mobile - Language and Currency Switchers */}
                    <div className="flex items-center justify-between">
                      <LanguageSwitcher />
                      <CurrencySwitcher />
                    </div>
                    <Button
                      variant={account ? "outline" : "default"}
                      onClick={handleWalletAction}
                      className="w-full justify-start gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      {account ? (
                        <span>{account.address?.slice(0, 6)}...{account.address?.slice(-4)}</span>
                      ) : (
                        t('auth.connectWallet')
                      )}
                    </Button>

                    {user ? (
                      <Button
                        variant="ghost"
                        onClick={signOut}
                        className="w-full justify-start gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('auth.signOut')}
                      </Button>
                    ) : (
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
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
