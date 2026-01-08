import { Button } from "@/components/ui/button";
import { Mail, Twitter, ExternalLink } from "lucide-react";

export function Footer() {
  const web3Alias = process.env.NEXT_PUBLIC_WEB3_ALIAS || 'luxledger.crypto';
  const twitterHandle = process.env.NEXT_PUBLIC_TW_HANDLE || '@LuxLedgerHQ';

  const footerLinks = {
    platform: [
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
      { name: "Fees & Pricing", href: "/pay" },
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
        
        {/* Web3 Address Banner */}
        <div className="text-center py-6 mb-8 border-b" style={{ borderColor: 'var(--graphite)' }}>
          <p className="text-lg font-semibold" style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)' }}>
            Official Web3 address: {web3Alias}
          </p>
        </div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/brand/crown-mono.svg" alt="LuxLedger" className="w-8 h-8" />
              <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
                LUXLEDGER
              </span>
            </div>
            <p style={{ color: 'var(--ivory)', fontFamily: 'var(--font-ui)' }}>
              Luxury, verified. Ownership in seconds.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
              Platform
            </h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:underline transition-colors"
                    style={{ color: 'var(--ivory)', fontFamily: 'var(--font-ui)' }}
                  >
                    {link.name}
                  </a>
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
            © 2024 LuxLedger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}