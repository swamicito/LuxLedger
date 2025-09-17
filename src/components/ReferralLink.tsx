/**
 * Referral Link Generator Component
 * Allows brokers to copy their custom referral URLs
 */

'use client'

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralLinkProps {
  referralCode: string;
  type?: 'listing' | 'marketplace' | 'short' | 'signup';
  className?: string;
}

export function ReferralLink({ referralCode, type = 'marketplace', className = '' }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://luxledger.app';
    
    switch (type) {
      case 'listing':
        return `${baseUrl}/list?ref=${referralCode}`;
      case 'marketplace':
        return `${baseUrl}/marketplace?ref=${referralCode}`;
      case 'signup':
        return `${baseUrl}/auth?ref=${referralCode}`;
      case 'short':
        return `${baseUrl}/r/${referralCode}`;
      default:
        return `${baseUrl}?ref=${referralCode}`;
    }
  };

  const url = getUrl();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const openLink = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700">
        <input
          className="w-full bg-transparent px-3 py-2 text-sm text-gray-200 focus:outline-none"
          value={url}
          readOnly
        />
      </div>
      
      <button
        onClick={copy}
        className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
          copied 
            ? 'bg-green-600 text-white' 
            : 'bg-yellow-600 hover:bg-yellow-500 text-black'
        }`}
        title="Copy to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy
          </>
        )}
      </button>

      <button
        onClick={openLink}
        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors flex items-center gap-2"
        title="Open link"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}

// Multi-link component for broker dashboard
export function ReferralLinkSet({ referralCode }: { referralCode: string }) {
  const linkTypes = [
    { type: 'listing' as const, label: 'Listing Page', description: 'Direct sellers to list their luxury items' },
    { type: 'marketplace' as const, label: 'Marketplace', description: 'Send buyers to browse luxury items' },
    { type: 'short' as const, label: 'Short URL', description: 'Perfect for social media sharing' },
    { type: 'signup' as const, label: 'Sign Up', description: 'Direct new users to registration' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Your Referral Links</h3>
      
      {linkTypes.map(({ type, label, description }) => (
        <div key={type} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-white">{label}</h4>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          
          <ReferralLink 
            referralCode={referralCode} 
            type={type}
            className="mt-3"
          />
        </div>
      ))}
    </div>
  );
}
