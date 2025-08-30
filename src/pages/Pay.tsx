import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode } from '@/components/ui/qr-code';
import { Copy, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';

const Pay = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const xlmAddress = process.env.NEXT_PUBLIC_XLM_ADDRESS || 'GBUJKLKAPYCWCFCY6QIY5DHLZRRQ2PVHGYOJE6KLID4KHQNSK534ENZO';
  const xrpAddress = process.env.NEXT_PUBLIC_XRP_ADDRESS || 'REPLACE_WITH_YOUR_r_ADDRESS';
  const xrpDestinationTag = process.env.NEXT_PUBLIC_XRP_DESTINATION_TAG || '';
  const web3Alias = process.env.NEXT_PUBLIC_WEB3_ALIAS || 'luxledger.crypto';

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const openLobstr = () => {
    const lobstrUrl = `web+stellar:pay?destination=${xlmAddress}`;
    window.open(lobstrUrl, '_blank');
  };

  const openXaman = () => {
    toast.info('XUMM integration coming soon');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--lux-black)', color: 'var(--ivory)' }}>
      <div className="container mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Pay LuxLedger
          </h1>
          <p className="text-xl mb-2" style={{ color: 'var(--ivory)' }}>
            Official Web3 Address
          </p>
          <div className="text-2xl font-semibold" style={{ color: 'var(--gold)' }}>
            {web3Alias}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          
          {/* XLM Block */}
          <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
              Stellar (XLM)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={xlmAddress}
                    readOnly
                    className="flex-1 p-3 rounded border text-sm font-mono"
                    style={{ 
                      backgroundColor: 'var(--graphite)', 
                      borderColor: 'var(--gold)',
                      color: 'var(--ivory)'
                    }}
                  />
                  <Button
                    onClick={() => copyToClipboard(xlmAddress, 'xlm')}
                    variant="outline"
                    size="sm"
                    className="p-3"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Memo</label>
                <input
                  type="text"
                  value="Not required"
                  readOnly
                  className="w-full p-3 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--graphite)', 
                    borderColor: 'var(--gold)',
                    color: 'var(--ivory)'
                  }}
                />
              </div>

              <div className="flex justify-center py-4">
                <QrCode value={xlmAddress} size={180} />
              </div>

              <Button
                onClick={openLobstr}
                className="w-full btn-gold"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Lobstr
              </Button>
            </div>
          </div>

          {/* XRP Block */}
          <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
              XRP (Ripple)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={xrpAddress}
                    readOnly
                    className="flex-1 p-3 rounded border text-sm font-mono"
                    style={{ 
                      backgroundColor: 'var(--graphite)', 
                      borderColor: 'var(--gold)',
                      color: 'var(--ivory)'
                    }}
                  />
                  <Button
                    onClick={() => copyToClipboard(xrpAddress, 'xrp')}
                    variant="outline"
                    size="sm"
                    className="p-3"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Destination Tag</label>
                <input
                  type="text"
                  value={xrpDestinationTag || "Not required"}
                  readOnly
                  className="w-full p-3 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--graphite)', 
                    borderColor: 'var(--gold)',
                    color: 'var(--ivory)'
                  }}
                />
              </div>

              <div className="flex justify-center py-4">
                <QrCode value={xrpAddress} size={180} />
              </div>

              <Button
                onClick={openXaman}
                className="w-full btn-gold"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Xaman (XUMM)
              </Button>
            </div>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="max-w-3xl mx-auto p-6 rounded-lg border" style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--gold)' }}>
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: 'var(--gold)' }} />
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gold)' }}>
                Security Notice
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ivory)' }}>
                We will never ask for your seed phrase. Verify payments to {web3Alias} and match QR to the raw address. 
                Avoid sending from exchanges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pay;
