/**
 * Trust & Security Page
 * Verifiable identity, domain structure, and security practices
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Globe, 
  Lock, 
  Fingerprint,
  Server,
  Eye,
  AlertTriangle,
  ChevronLeft,
  Video,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

// Official platform identity - single source of truth
const PLATFORM_IDENTITY = {
  // Canonical domain (THE product)
  primaryDomain: import.meta.env.VITE_PUBLIC_SITE_URL?.replace('https://', '') || 'luxledger.io',
  primaryUrl: import.meta.env.VITE_PUBLIC_SITE_URL || 'https://luxledger.io',
  
  // Web3 identity (cryptographic anchor)
  web3Identity: import.meta.env.VITE_WEB3_ALIAS || 'luxledger.crypto',
  
  // Escrow authority wallet
  xrpWallet: import.meta.env.VITE_XRP_ADDRESS || 'Not configured',
  
  // Network info
  xrplNetwork: import.meta.env.VITE_XRPL_NETWORK === 'testnet' ? 'XRPL Testnet' : 'XRPL Mainnet',
  explorerUrl: import.meta.env.VITE_XRPL_NETWORK === 'testnet' 
    ? 'https://testnet.xrpl.org/accounts/' 
    : 'https://livenet.xrpl.org/accounts/',
};

export default function TrustSecurity() {
  const navigate = useNavigate();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  TRUST & SECURITY
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Verify our identity · Understand our protections
                </p>
              </div>
            </div>
            
            {/* Center: Verification Status */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Domain</p>
                <p className="text-sm font-mono" style={{ color: '#F5F5F7' }}>{PLATFORM_IDENTITY.primaryDomain}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Web3 ID</p>
                <p className="text-sm font-mono" style={{ color: '#F5F5F7' }}>{PLATFORM_IDENTITY.web3Identity}</p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm" style={{ color: '#22C55E' }}>Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Verify LuxLedger Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-6 border-amber-500/30 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Fingerprint className="h-5 w-5" />
                How to Verify LuxLedger
              </CardTitle>
              <CardDescription className="text-gray-400">
                Use these official identifiers to confirm you're on the real LuxLedger platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Domain */}
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Official Domain</p>
                    <p className="font-mono font-semibold text-white">{PLATFORM_IDENTITY.primaryDomain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(PLATFORM_IDENTITY.primaryDomain, 'Domain')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Web3 Identity */}
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Web3 Identity</p>
                    <p className="font-mono font-semibold text-white">{PLATFORM_IDENTITY.web3Identity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                    Unstoppable Domain
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(PLATFORM_IDENTITY.web3Identity, 'Web3 Identity')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Escrow Wallet */}
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Escrow Authority ({PLATFORM_IDENTITY.xrplNetwork})
                    </p>
                    <p className="font-mono text-sm break-all text-white">
                      {PLATFORM_IDENTITY.xrpWallet}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {PLATFORM_IDENTITY.xrpWallet !== 'Not configured' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => window.open(
                          `${PLATFORM_IDENTITY.explorerUrl}${PLATFORM_IDENTITY.xrpWallet}`,
                          '_blank'
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(PLATFORM_IDENTITY.xrpWallet, 'Escrow Wallet')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="mb-6 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-amber-400" />
                Security Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-white">Blockchain Escrow</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Funds remain in escrow until delivery is confirmed. 
                    Held on-chain, not by LuxLedger.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-white">Video Verification</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    High-value assets ($10,000+) require video proof showing condition, 
                    serial numbers, and authenticity markers.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-white">Dispute Protection</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    48-hour inspection window after delivery. Report issues before 
                    funds are released to the seller.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Fingerprint className="h-4 w-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-white">Wallet Authentication</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Sign transactions with your own wallet. We never hold your keys 
                    or have access to your funds.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Phishing Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-6 border-amber-500/30 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Protect Yourself from Scams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-400">
                LuxLedger will <strong className="text-white">never</strong>:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Ask for your wallet seed phrase or private keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Request payment outside the escrow system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Contact you via DM on social media to complete transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Ask you to send XRP to "verify" your wallet</span>
                </li>
              </ul>
              <div className="mt-4 rounded-lg bg-black/40 border border-gray-800 p-3">
                <p className="text-xs text-amber-300">
                  <strong>Always verify:</strong> Check that you're on <code className="bg-black/60 px-1 rounded text-white">luxledger.io</code> and 
                  that escrow transactions go to our official wallet address listed above.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Report a Security Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Found a vulnerability or suspicious activity? Contact our security team:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => window.location.href = 'mailto:security@luxledger.io'}
                >
                  security@luxledger.io
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => navigate('/help')}
                >
                  Help Center
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
