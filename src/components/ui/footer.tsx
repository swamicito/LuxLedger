import { Link } from "react-router-dom";
import { Mail, Twitter, Shield, ExternalLink } from "lucide-react";

export function Footer() {
  const web3Alias = import.meta.env.VITE_WEB3_ALIAS || 'luxledger.crypto';
  const twitterHandle = import.meta.env.VITE_TW_HANDLE || '@LuxLedgerHQ';

  const footerLinks = {
    platform: [
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
      { name: "Fees & Pricing", href: "/pay" },
      { name: "Trust & Security", href: "/trust" },
      { name: "Contact", href: "/contact" }
    ]
  };

  const socialLinks = [
    { Icon: Twitter, href: `https://twitter.com/${twitterHandle.replace('@', '')}`, label: twitterHandle },
    { Icon: Mail, href: "mailto:contact@luxledger.com", label: "Contact" }
  ];

  return (
    <footer style={{ backgroundColor: 'var(--charcoal)', borderTop: '1px solid var(--graphite)' }}>
      <div className="container mx-auto px-6 py-12">
        
        {/* Web3 Identity Banner */}
        <div className="text-center py-6 mb-8 border-b" style={{ borderColor: 'var(--graphite)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--ivory)' }}>
              Official Web3 Identity
            </span>
          </div>
          <Link 
            to="/trust"
            className="inline-flex items-center gap-2 text-lg font-semibold hover:underline transition-colors"
            style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)' }}
          >
            {web3Alias}
            <ExternalLink className="w-4 h-4 opacity-60" />
          </Link>
          <p className="text-xs mt-2" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
            Verify our identity on the Trust & Security page
          </p>
        </div>

        {/* Centered Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <img src="/brand/crown-mono.svg" alt="LuxLedger" className="w-10 h-10" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
              LUXLEDGER
            </span>
          </div>
          <p className="text-center" style={{ color: 'var(--ivory)', fontFamily: 'var(--font-ui)' }}>
            Luxury, verified. Ownership in seconds.
          </p>
        </div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-2xl mx-auto text-center md:text-left">

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
              Platform
            </h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="hover:underline transition-colors hover:text-amber-400"
                    style={{ color: 'var(--ivory)', fontFamily: 'var(--font-ui)' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
              Connect
            </h3>
            <div className="space-y-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center space-x-2 hover:underline transition-colors"
                  style={{ color: 'var(--ivory)', fontFamily: 'var(--font-ui)' }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 text-center" style={{ borderColor: 'var(--graphite)' }}>
          <p style={{ color: 'var(--ivory)', fontFamily: 'var(--font-ui)' }} className="text-sm">
            © 2026 LuxLedger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}