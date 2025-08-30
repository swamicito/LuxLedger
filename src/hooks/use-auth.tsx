import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWallet } from './use-wallet';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithWallet: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userProfile: any;
  userRole: string | null;
  isWalletLinked: boolean;
  linkWallet: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isWalletLinked, setIsWalletLinked] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile and role after auth state change
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error);
        return;
      }

      setUserRole(data?.role || 'pending_user');
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Check your email to confirm your account!');
      return { error: null };
    } catch (error: any) {
      toast.error('Sign up failed');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      toast.success('Signed in successfully!');
      return { error: null };
    } catch (error: any) {
      toast.error('Sign in failed');
      return { error };
    }
  };

  const signInWithWallet = async () => {
    try {
      // This would integrate with XUMM wallet authentication
      // For now, create a demo wallet-based user
      const walletAddress = 'rDemoWallet1234567890LuxLedger';
      
      // Create or get user with wallet address as identifier
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        toast.error(error.message);
        return { error };
      }

      // Link wallet address to user profile
      await supabase
        .from('profiles')
        .upsert({
          user_id: data.user.id,
          wallet_address: walletAddress,
          auth_method: 'wallet',
          updated_at: new Date().toISOString(),
        });

      toast.success('Signed in with wallet successfully!');
      return { error: null };
    } catch (error: any) {
      toast.error('Wallet sign in failed');
      return { error };
    }
  };

  const linkWallet = async () => {
    try {
      if (!user) {
        toast.error('Please sign in first');
        return { error: 'No user' };
      }

      const walletAddress = 'rDemoWallet1234567890LuxLedger';
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      setIsWalletLinked(true);
      toast.success('Wallet linked successfully!');
      return { error: null };
    } catch (error: any) {
      toast.error('Failed to link wallet');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setIsWalletLinked(false);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Sign out failed');
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithWallet,
    signOut,
    userProfile,
    userRole,
    isWalletLinked,
    linkWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}