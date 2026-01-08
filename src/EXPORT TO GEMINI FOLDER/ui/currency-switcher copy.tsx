import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { geoService } from '@/lib/geo-utils';
import { DollarSign, Check } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'XRP', name: 'XRP', symbol: 'XRP', flag: '⚡' },
];

export const CurrencySwitcher = () => {
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    initializeUserCurrency();
  }, []);

  const initializeUserCurrency = async () => {
    try {
      const location = await geoService.getUserLocation();
      const userCurrency = currencies.find(c => c.code === location.currency) || currencies[0];
      setSelectedCurrency(userCurrency);
    } catch (error) {
      console.error('Failed to get user currency:', error);
    }
  };

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsOpen(false);
    
    // Store preference in localStorage
    localStorage.setItem('preferred_currency', currency.code);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('currencyChanged', { 
      detail: { currency: currency.code } 
    }));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedCurrency.flag}</span>
          <span className="font-mono">{selectedCurrency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <div className="flex flex-col">
                <span className="font-mono text-sm">{currency.code}</span>
                <span className="text-xs text-muted-foreground">{currency.name}</span>
              </div>
            </div>
            {selectedCurrency.code === currency.code && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
