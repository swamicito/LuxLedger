import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { xrplClient } from '@/lib/xrpl-client';
import { autoRegister } from '@/lib/luxbroker/auto-register';
import { supabase } from '@/lib/supabase-client';
import {
  createPayload as createXummPayload,
  getPayload as getXummPayload,
  waitForSignature,
  savePendingSignIn,
  readPendingSignIn,
  clearPendingSignIn,
} from '@/lib/escrow/xaman-escrow';

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

  // Persist the connected wallet on profiles.wallet_address for auth.uid() —
  // this is what makes the user escrow-able (buyer/seller r-address lookups).
  const finalizeWalletConnect = useCallback(
    async (walletAddress: string, signerPubkey?: string) => {
      // Account metadata is best-effort — never block the connect on it.
      let balance = '0';
      let trustlines: any[] = [];
      let nfts: any[] = [];
      try {
        balance = await xrplClient.getAccountBalance(walletAddress);
        trustlines = await xrplClient.getAccountTrustlines(walletAddress);
        nfts = await xrplClient.getAccountNFTs(walletAddress);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Wallet metadata fetch failed (non-critical):', error);
      }

      const connectedAccount: WalletAccount = {
        address: walletAddress,
        balance: `${balance} XRP`,
        network: import.meta.env.VITE_XRPL_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
        publicKey: signerPubkey,
        trustlines,
        nfts,
      };

      setAccount(connectedAccount);
      localStorage.setItem('luxledger_wallet', JSON.stringify(connectedAccount));

      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (uid) {
          const { error: walletWriteError } = await supabase
            .from('profiles')
            .update({ wallet_address: walletAddress })
            .eq('user_id', uid);
          if (walletWriteError) {
            // eslint-disable-next-line no-console
            console.error('[wallet] profiles.wallet_address write failed', walletWriteError);
            toast({
              title: 'Wallet connected but not saved',
              description: walletWriteError.message,
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[wallet] profile persist failed', error);
      }

      autoRegister.registerSeller(walletAddress).catch(() => {
        // Silently fail - non-critical for wallet connection
      });

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${walletAddress.slice(0, 8)}...`,
      });
    },
    [toast]
  );

  // Check for existing wallet connection on mount, then resume a pending
  // Xaman SignIn — a phone that backgrounded/killed the tab mid-sign would
  // otherwise leave the site showing "Connect Wallet" after a real sign.
  useEffect(() => {
    const savedAccount = localStorage.getItem('luxledger_wallet');
    if (savedAccount) {
      try {
        setAccount(JSON.parse(savedAccount));
      } catch (error) {
        localStorage.removeItem('luxledger_wallet');
      }
    }

    const pending = readPendingSignIn();
    if (!pending) return;
    (async () => {
      try {
        const status = await getXummPayload(pending.uuid);
        if (status.meta?.resolved) {
          if (status.meta.signed && status.response?.account) {
            await finalizeWalletConnect(
              status.response.account,
              status.response.signer_pubkey as string | undefined
            );
          }
          clearPendingSignIn();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[wallet] pending sign-in resume failed', error);
      }
    })();
  }, [finalizeWalletConnect]);

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

        // Auto-register seller with LuxBroker system (demo mode) - fire and forget
        autoRegister.registerSeller(demoAccount.address).catch(() => {
          // Silently fail - non-critical for wallet connection
        });

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

        // Create XUMM sign-in request via server-side API
        const signInRequest = await createXummPayload({
          TransactionType: 'SignIn'
        });

        if (!signInRequest?.next?.always || !signInRequest.uuid) {
          throw new Error('Failed to create XUMM sign-in request');
        }

        // Persist before the app-switch: if the mobile tab reloads, the mount
        // effect above completes this sign-in without a second tap.
        savePendingSignIn(signInRequest.uuid);
        window.open(signInRequest.next.always, '_blank');

        // Poll until the user signs or declines — wakes on visibility/focus.
        const signInResult = await waitForSignature(signInRequest.uuid);

        if (signInResult.meta?.signed && signInResult.response?.account) {
          await finalizeWalletConnect(
            signInResult.response.account,
            signInResult.response.signer_pubkey as string | undefined
          );
          clearPendingSignIn();
        } else {
          clearPendingSignIn();
          throw new Error('Sign-in was declined or expired in Xaman.');
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
      const trustlinePayload = await createXummPayload({
        TransactionType: 'TrustSet',
        Account: account.address,
        LimitAmount: {
          currency: currency,
          issuer: issuer,
          value: '1000000000'
        }
      });

      if (trustlinePayload?.next?.always) {
        window.open(trustlinePayload.next.always, '_blank');

        const result = await waitForSignature(trustlinePayload.uuid);

        if (result.meta?.signed && result.response?.txid) {
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
      const payload = await createXummPayload(transaction);

      if (payload?.next?.always) {
        window.open(payload.next.always, '_blank');

        const result = await waitForSignature(payload.uuid);

        if (result.meta?.signed && result.response?.txid) {
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