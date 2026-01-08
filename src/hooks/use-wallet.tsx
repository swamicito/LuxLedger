import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { XummSdk } from 'xumm-sdk';
import { xrplClient } from '@/lib/xrpl-client';
import { autoRegister } from '@/lib/luxbroker/auto-register';

// XUMM SDK Configuration
const xummSdk = new XummSdk(
  import.meta.env.VITE_XUMM_API_KEY || 'demo-api-key',
  import.meta.env.VITE_XUMM_API_SECRET || 'demo-api-secret'
);

// Enhanced Wallet Account Interface
interface WalletAccount {
  address: string;
  balance?: string;
  network: 'mainnet' | 'testnet';
  publicKey?: string;
  networkId?: number;
  trustlines?: any[];
  nfts?: any[];
}

interface WalletContextType {
  account: WalletAccount | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTransaction: (transaction: any) => Promise<string>;
  refreshAccountData: () => Promise<void>;
  createTrustline: (currency: string, issuer: string) => Promise<string>;
  getAccountNFTs: () => Promise<any[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check for existing wallet connection on mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('luxledger_wallet');
    if (savedAccount) {
      try {
        setAccount(JSON.parse(savedAccount));
      } catch (error) {
        localStorage.removeItem('luxledger_wallet');
      }
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if we're in development mode
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment || !import.meta.env.VITE_XUMM_API_KEY) {
        // Development mode - use demo wallet
        toast({
          title: "Demo Mode",
          description: "Connecting to demo wallet for development...",
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const demoAccount: WalletAccount = {
          address: 'rDemoWallet1234567890LuxLedger',
          balance: '1,000 XRP',
          network: 'testnet',
          trustlines: [],
          nfts: []
        };

        setAccount(demoAccount);
        localStorage.setItem('luxledger_wallet', JSON.stringify(demoAccount));

        // Auto-register seller with LuxBroker system (demo mode)
        try {
          await autoRegister.registerSeller(demoAccount.address);
        } catch (error) {
          console.log('Auto-register failed (non-critical):', error);
        }

        toast({
          title: "Demo Wallet Connected",
          description: `Connected to ${demoAccount.address.slice(0, 8)}...`,
        });
      } else {
        // Production mode - use XUMM
        toast({
          title: "XUMM Connection",
          description: "Opening XUMM for authentication...",
        });

        // Create XUMM sign-in request
        const signInRequest = await xummSdk.payload.create({
          txjson: {
            TransactionType: 'SignIn'
          }
        });

        if (signInRequest?.next?.always) {
          // Open XUMM app/browser
          window.open(signInRequest.next.always, '_blank');
          
          // Wait for user to sign in
          const signInResult = await xummSdk.payload.get(signInRequest.uuid);
          
          if (signInResult?.response?.account) {
            const walletAddress = signInResult.response.account;
            
            // Get account data from XRPL
            const balance = await xrplClient.getAccountBalance(walletAddress);
            const trustlines = await xrplClient.getAccountTrustlines(walletAddress);
            const nfts = await xrplClient.getAccountNFTs(walletAddress);

            const connectedAccount: WalletAccount = {
              address: walletAddress,
              balance: `${balance} XRP`,
              network: import.meta.env.VITE_XRPL_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
              publicKey: signInResult.response.signer_pubkey,
              trustlines,
              nfts
            };

            setAccount(connectedAccount);
            localStorage.setItem('luxledger_wallet', JSON.stringify(connectedAccount));

            // Auto-register seller with LuxBroker system
            try {
              await autoRegister.registerSeller(walletAddress);
            } catch (error) {
              console.log('Auto-register failed (non-critical):', error);
            }

            toast({
              title: "Wallet Connected",
              description: `Connected to ${walletAddress.slice(0, 8)}...`,
            });
          } else {
            throw new Error('User cancelled sign-in');
          }
        } else {
          throw new Error('Failed to create XUMM sign-in request');
        }
      }

    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem('luxledger_wallet');
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been safely disconnected.",
    });
  };

  const refreshAccountData = async (): Promise<void> => {
    if (!account) return;

    try {
      const balance = await xrplClient.getAccountBalance(account.address);
      const trustlines = await xrplClient.getAccountTrustlines(account.address);
      const nfts = await xrplClient.getAccountNFTs(account.address);

      const updatedAccount = {
        ...account,
        balance: `${balance} XRP`,
        trustlines,
        nfts
      };

      setAccount(updatedAccount);
      localStorage.setItem('luxledger_wallet', JSON.stringify(updatedAccount));
    } catch (error) {
      console.error('Error refreshing account data:', error);
    }
  };

  const createTrustline = async (currency: string, issuer: string): Promise<string> => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      // Demo mode - simulate trustline creation
      toast({
        title: "Demo Trustline Created",
        description: `Trustline for ${currency} created successfully`,
      });
      
      await refreshAccountData();
      return 'demo_trustline_hash_' + Date.now();
    } else {
      // Production mode - use XUMM to sign trustline transaction
      const trustlinePayload = await xummSdk.payload.create({
        txjson: {
          TransactionType: 'TrustSet',
          Account: account.address,
          LimitAmount: {
            currency: currency,
            issuer: issuer,
            value: '1000000000'
          }
        }
      });

      if (trustlinePayload?.next?.always) {
        window.open(trustlinePayload.next.always, '_blank');
        
        const result = await xummSdk.payload.get(trustlinePayload.uuid);
        
        if (result?.response?.txid) {
          toast({
            title: "Trustline Created",
            description: `Trustline for ${currency} created successfully`,
          });
          
          await refreshAccountData();
          return result.response.txid;
        } else {
          throw new Error('User cancelled trustline creation');
        }
      } else {
        throw new Error('Failed to create trustline request');
      }
    }
  };

  const getAccountNFTs = async (): Promise<any[]> => {
    if (!account) return [];
    
    try {
      return await xrplClient.getAccountNFTs(account.address);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  };

  const signTransaction = async (transaction: any): Promise<string> => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      // Demo mode - simulate transaction signing
      toast({
        title: "Demo Transaction Signed",
        description: "Transaction has been signed and submitted.",
      });

      return 'demo_transaction_hash_' + Date.now();
    } else {
      // Production mode - use XUMM to sign transaction
      const payload = await xummSdk.payload.create({
        txjson: transaction
      });

      if (payload?.next?.always) {
        window.open(payload.next.always, '_blank');
        
        const result = await xummSdk.payload.get(payload.uuid);
        
        if (result?.response?.txid) {
          toast({
            title: "Transaction Signed",
            description: "Transaction has been signed and submitted.",
          });
          
          return result.response.txid;
        } else {
          throw new Error('User cancelled transaction');
        }
      } else {
        throw new Error('Failed to create transaction request');
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnecting,
        connectWallet,
        disconnectWallet,
        signTransaction,
        refreshAccountData,
        createTrustline,
        getAccountNFTs,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};