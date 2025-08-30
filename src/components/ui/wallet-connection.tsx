import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWallet } from '@/hooks/use-wallet';
import { Wallet, Loader2, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WalletConnectionProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function WalletConnection({ variant = 'outline', size = 'default', className }: WalletConnectionProps) {
  const { account, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("btn-luxury-outline", className)}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {formatAddress(account.address)}
          </Button>
        </DialogTrigger>
        <DialogContent className="luxury-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-luxury-gradient font-playfair text-2xl">
              Wallet Connected
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="bg-card-gradient p-4 rounded-lg border border-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{formatAddress(account.address)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold text-primary">{account.balance}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="capitalize text-accent">{account.network}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`https://xrpl.org/accounts/${account.address}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on XRPL Explorer
              </Button>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  disconnectWallet();
                  setIsOpen(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("btn-luxury-outline", className)}
      onClick={connectWallet}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}