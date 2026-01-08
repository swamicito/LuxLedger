import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ReferralLinkSetProps {
  referralCode: string;
  baseUrl?: string;
}

export default function ReferralLinkSet({ 
  referralCode, 
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '' 
}: ReferralLinkSetProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const referralLinks = [
    {
      title: "General Referral",
      url: `${baseUrl}?ref=${referralCode}`,
      description: "Share this link to earn commissions on all sales"
    },
    {
      title: "Marketplace Link", 
      url: `${baseUrl}/marketplace?ref=${referralCode}`,
      description: "Direct link to marketplace with your referral code"
    },
    {
      title: "Broker Landing",
      url: `${baseUrl}/ref/${referralCode}`,
      description: "Dedicated landing page for your referrals"
    }
  ];

  const copyToClipboard = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast.success("Referral link copied to clipboard!");
      
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  if (!referralCode) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Loading referral links...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {referralLinks.map((link, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">{link.title}</CardTitle>
              <p className="text-sm text-gray-400">{link.description}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                <code className="flex-1 text-sm text-gray-300 font-mono break-all">
                  {link.url}
                </code>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(link.url, index)}
                    className="h-8 w-8 p-0 hover:bg-gray-700"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openLink(link.url)}
                    className="h-8 w-8 p-0 hover:bg-gray-700"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
