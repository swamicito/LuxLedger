/**
 * Escrow Authentication Hook
 * Integrates with existing wallet authentication for escrow operations
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './use-wallet';
import { useAuth } from './use-auth';

interface EscrowAuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  walletSeed: string | null;
  authToken: string | null;
  canCreateEscrow: boolean;
  canFinishEscrow: boolean;
  canCancelEscrow: boolean;
}

interface EscrowAuthContextType extends EscrowAuthState {
  authenticate: () => Promise<boolean>;
  signEscrowTransaction: (txData: any) => Promise<string>;
  getAuthHeaders: () => Record<string, string>;
  logout: () => void;
}

const EscrowAuthContext = createContext<EscrowAuthContextType | null>(null);

export function EscrowAuthProvider({ children }: { children: ReactNode }) {
  const { account, isConnecting } = useWallet();
  const { user, session } = useAuth();
  
  const [authState, setAuthState] = useState<EscrowAuthState>({
    isAuthenticated: false,
    walletAddress: null,
    walletSeed: null,
    authToken: null,
    canCreateEscrow: false,
    canFinishEscrow: false,
    canCancelEscrow: false
  });

  useEffect(() => {
    updateAuthState();
  }, [account, user, session]);

  const updateAuthState = () => {
    const hasWallet = !!account?.address;
    const hasUser = !!user && !!session;
    
    setAuthState({
      isAuthenticated: hasWallet && hasUser,
      walletAddress: account?.address || null,
      walletSeed: null, // In production, never expose seed
      authToken: user?.id || null,
      canCreateEscrow: hasWallet && hasUser,
      canFinishEscrow: hasWallet && hasUser,
      canCancelEscrow: hasWallet && hasUser
    });
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      // In production, this would trigger wallet connection flow
      if (!account?.address) {
        // Trigger wallet connection
        return false;
      }

      if (!user || !session) {
        // Trigger user authentication
        return false;
      }

      return true;
    } catch (error) {
      console.error('Escrow authentication failed:', error);
      return false;
    }
  };

  const signEscrowTransaction = async (txData: any): Promise<string> => {
    if (!authState.walletAddress) {
      throw new Error('Wallet not available for signing');
    }

    // In production, this would use secure signing methods
    // For demo purposes, we'll return a mock signature
    const mockSignature = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    return mockSignature;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};

    if (authState.walletAddress) {
      headers['x-wallet'] = JSON.stringify({
        address: authState.walletAddress
      });
    }

    if (authState.authToken) {
      headers['x-auth-token'] = authState.authToken;
    }

    return headers;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      walletAddress: null,
      walletSeed: null,
      authToken: null,
      canCreateEscrow: false,
      canFinishEscrow: false,
      canCancelEscrow: false
    });
  };

  const contextValue: EscrowAuthContextType = {
    ...authState,
    authenticate,
    signEscrowTransaction,
    getAuthHeaders,
    logout
  };

  return (
    <EscrowAuthContext.Provider value={contextValue}>
      {children}
    </EscrowAuthContext.Provider>
  );
}

export function useEscrowAuth(): EscrowAuthContextType {
  const context = useContext(EscrowAuthContext);
  
  if (!context) {
    throw new Error('useEscrowAuth must be used within EscrowAuthProvider');
  }
  
  return context;
}

/**
 * Hook for escrow-specific wallet operations
 */
export function useEscrowWallet() {
  const escrowAuth = useEscrowAuth();
  
  const createEscrow = async (params: any) => {
    if (!escrowAuth.canCreateEscrow) {
      throw new Error('Not authenticated for escrow creation');
    }

    const response = await fetch('/.netlify/functions/escrow-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...escrowAuth.getAuthHeaders()
      },
      body: JSON.stringify(params)
    });

    return response.json();
  };

  const finishEscrow = async (params: any) => {
    if (!escrowAuth.canFinishEscrow) {
      throw new Error('Not authenticated for escrow completion');
    }

    const response = await fetch('/.netlify/functions/escrow-finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...escrowAuth.getAuthHeaders()
      },
      body: JSON.stringify(params)
    });

    return response.json();
  };

  const cancelEscrow = async (params: any) => {
    if (!escrowAuth.canCancelEscrow) {
      throw new Error('Not authenticated for escrow cancellation');
    }

    const response = await fetch('/.netlify/functions/escrow-cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...escrowAuth.getAuthHeaders()
      },
      body: JSON.stringify(params)
    });

    return response.json();
  };

  const getEscrowStatus = async (owner: string, sequence: number) => {
    const response = await fetch(
      `/.netlify/functions/escrow-status?owner=${owner}&sequence=${sequence}`
    );

    return response.json();
  };

  return {
    createEscrow,
    finishEscrow,
    cancelEscrow,
    getEscrowStatus,
    ...escrowAuth
  };
}
