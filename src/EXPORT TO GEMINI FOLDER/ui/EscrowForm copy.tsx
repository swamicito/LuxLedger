/**
 * Enhanced Escrow Form Component
 * Based on provided examples with improved UX and validation
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useEscrowAuth } from "@/hooks/use-escrow-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EscrowFormData {
  buyerAddress: string;
  sellerAddress: string;
  amountUSD: number;
  expirationSeconds: number;
  escrowSequence: string;
  assetType?: string;
}

export default function EscrowForm() {
  const { isAuthenticated, getAuthHeaders } = useEscrowAuth();
  const [form, setForm] = useState<EscrowFormData>({
    buyerAddress: "",
    sellerAddress: "",
    amountUSD: 100,
    expirationSeconds: 3600,
    escrowSequence: "",
    assetType: ""
  });
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<"create" | "finalize">("create");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!form.buyerAddress.startsWith('r')) {
      return "Invalid buyer XRPL address format";
    }
    
    if (mode === "create" && !form.sellerAddress.startsWith('r')) {
      return "Invalid seller XRPL address format";
    }
    
    if (mode === "create" && (form.amountUSD < 100 || form.amountUSD > 10_000_000)) {
      return "Amount must be between $100 and $10M USD";
    }
    
    if (mode === "finalize" && !form.escrowSequence) {
      return "Escrow sequence required for finalization";
    }
    
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Please connect your wallet and sign in");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = mode === "create" ? "escrow-create" : "escrow-finish";
      const requestBody = mode === "create" ? {
        amountUSD: form.amountUSD,
        buyerAddress: form.buyerAddress,
        sellerAddress: form.sellerAddress,
        expirationDays: Math.ceil(form.expirationSeconds / 86400),
        assetTitle: form.assetType || "Luxury Asset",
        conditions: ["Asset delivery confirmed and condition verified"]
      } : {
        owner: form.buyerAddress,
        sequence: parseInt(form.escrowSequence)
      };

      const response = await fetch(`/.netlify/functions/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success(`Escrow ${mode === "create" ? "created" : "finalized"} successfully!`);
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Network error occurred");
      setResult({ error: "Network error" });
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: 'var(--lux-gold)' }}>
              <Shield className="w-6 h-6" />
              {mode === "create" ? "Create Escrow" : "Finalize Escrow"}
            </CardTitle>
            <div className="flex gap-2">
              <Badge 
                variant={mode === "create" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setMode("create")}
              >
                Create
              </Badge>
              <Badge 
                variant={mode === "finalize" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setMode("finalize")}
              >
                Finalize
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Buyer Address *</Label>
                <Input
                  placeholder="rBuyerAddress..."
                  value={form.buyerAddress}
                  onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {mode === "create" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Seller Address *</Label>
                    <Input
                      placeholder="rSellerAddress..."
                      value={form.sellerAddress}
                      onChange={(e) => setForm({ ...form, sellerAddress: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Amount (USD) *</Label>
                    <Input
                      type="number"
                      min="100"
                      max="10000000"
                      value={form.amountUSD}
                      onChange={(e) => setForm({ ...form, amountUSD: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                    <p className="text-sm text-gray-400">
                      Equivalent: ~{(form.amountUSD / 0.5).toFixed(2)} XRP
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Asset Type</Label>
                    <Input
                      placeholder="e.g., Luxury Watch, Jewelry, Art"
                      value={form.assetType}
                      onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Expiration (seconds)</Label>
                    <Input
                      type="number"
                      min="3600"
                      value={form.expirationSeconds}
                      onChange={(e) => setForm({ ...form, expirationSeconds: parseInt(e.target.value) || 3600 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <p className="text-sm text-gray-400">
                      {Math.ceil(form.expirationSeconds / 3600)} hours from now
                    </p>
                  </div>
                </>
              )}

              {mode === "finalize" && (
                <div className="space-y-2">
                  <Label className="text-white">Escrow Sequence *</Label>
                  <Input
                    type="number"
                    placeholder="12345"
                    value={form.escrowSequence}
                    onChange={(e) => setForm({ ...form, escrowSequence: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading || !isAuthenticated}
                className="w-full py-6 text-lg font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)', 
                  color: 'var(--lux-black)' 
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `${mode === "create" ? "Create" : "Finalize"} Escrow`
                )}
              </Button>

              {!isAuthenticated && (
                <div className="flex items-center gap-2 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-200">Connect wallet to proceed with escrow operations</span>
                </div>
              )}
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-lg"
                style={{ background: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="font-semibold text-white">
                    {result.success ? "Success" : "Error"}
                  </h3>
                </div>
                
                {result.success ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <strong>Transaction Hash:</strong> {result.txHash}
                    </p>
                    {result.escrowSequence && (
                      <p className="text-gray-300">
                        <strong>Escrow Sequence:</strong> {result.escrowSequence}
                      </p>
                    )}
                    {result.explorerUrl && (
                      <a 
                        href={result.explorerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View on XRPL Explorer
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-red-300">{result.error}</p>
                )}

                {result.preview && (
                  <details className="mt-4">
                    <summary className="text-gray-400 cursor-pointer">Transaction Details</summary>
                    <pre className="bg-gray-800 p-3 mt-2 rounded text-xs overflow-x-auto text-gray-300">
                      {JSON.stringify(result.preview, null, 2)}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
