import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowRightLeft, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "sonner";

interface SupportedChain {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  bridgeFee: number;
  estimatedTime: string;
  status: 'active' | 'maintenance' | 'coming_soon';
}

interface BridgeTransaction {
  id: string;
  asset_id: string;
  from_chain: string;
  to_chain: string;
  amount: number;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  tx_hash: string;
  created_at: string;
}

export function CrossChainBridge() {
  const [supportedChains] = useState<SupportedChain[]>([
    {
      id: 'xrpl',
      name: 'XRP Ledger',
      symbol: 'XRP',
      logo: '🔗',
      bridgeFee: 0.001,
      estimatedTime: '2-5 minutes',
      status: 'active'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      logo: '⟠',
      bridgeFee: 0.002,
      estimatedTime: '10-15 minutes',
      status: 'active'
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      logo: '◎',
      bridgeFee: 0.0001,
      estimatedTime: '1-3 minutes',
      status: 'active'
    },
    {
      id: 'avalanche',
      name: 'Avalanche',
      symbol: 'AVAX',
      logo: '🔺',
      bridgeFee: 0.001,
      estimatedTime: '3-8 minutes',
      status: 'coming_soon'
    },
    {
      id: 'polygon',
      name: 'Polygon',
      symbol: 'MATIC',
      logo: '⬟',
      bridgeFee: 0.0005,
      estimatedTime: '2-5 minutes',
      status: 'coming_soon'
    }
  ]);

  const [selectedAsset, setSelectedAsset] = useState("");
  const [fromChain, setFromChain] = useState("xrpl");
  const [toChain, setToChain] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [bridging, setBridging] = useState(false);

  const { user } = useAuth();
  const { account, isConnecting, connectWallet } = useWallet();

  useEffect(() => {
    // Mock transaction history
    setTransactions([
      {
        id: '1',
        asset_id: 'asset_1',
        from_chain: 'xrpl',
        to_chain: 'ethereum',
        amount: 0.5,
        status: 'completed',
        tx_hash: '0x1234...5678',
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        asset_id: 'asset_2',
        from_chain: 'ethereum',
        to_chain: 'solana',
        amount: 1.2,
        status: 'pending',
        tx_hash: '0xabcd...efgh',
        created_at: '2024-01-15T11:00:00Z'
      }
    ]);
  }, []);

  const getChain = (chainId: string) => supportedChains.find(c => c.id === chainId);
  const selectedFromChain = getChain(fromChain);
  const selectedToChain = getChain(toChain);

  const handleBridge = async () => {
    if (!selectedAsset || !fromChain || !toChain || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    setBridging(true);
    try {
      // Simulate bridge transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newTransaction: BridgeTransaction = {
        id: Date.now().toString(),
        asset_id: selectedAsset,
        from_chain: fromChain,
        to_chain: toChain,
        amount: parseFloat(amount),
        status: 'pending',
        tx_hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
        created_at: new Date().toISOString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      toast.success("Bridge transaction initiated successfully!");
      
      // Reset form
      setSelectedAsset("");
      setToChain("");
      setAmount("");
      
    } catch (error) {
      toast.error("Bridge transaction failed");
    } finally {
      setBridging(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirming': return <Progress value={75} className="w-4 h-1" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'coming_soon': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Cross-Chain Bridge
          </CardTitle>
          <CardDescription>Please log in to access cross-chain features</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary" />
            Cross-Chain Asset Bridge
          </h2>
          <p className="text-muted-foreground">Move your assets across multiple blockchain networks</p>
        </div>
      </div>

      {/* Supported Networks */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Networks</CardTitle>
          <CardDescription>Bridge your assets across these blockchain networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedChains.map((chain) => (
              <div key={chain.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-2xl">{chain.logo}</div>
                <div className="flex-1">
                  <div className="font-medium">{chain.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Fee: {chain.bridgeFee} {chain.symbol} • {chain.estimatedTime}
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(chain.status)}>
                  {chain.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bridge Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bridge Assets</CardTitle>
            <CardDescription>Transfer assets between blockchain networks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!account && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Connect your wallet to start bridging</span>
                </div>
                <Button 
                  className="mt-2 w-full" 
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Select Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an asset to bridge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset_1">Vintage Rolex Collection Share</SelectItem>
                  <SelectItem value="asset_2">London Property Token</SelectItem>
                  <SelectItem value="asset_3">Art Portfolio NFT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From Network</label>
                <Select value={fromChain} onValueChange={setFromChain}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedChains.filter(c => c.status === 'active').map((chain) => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.logo} {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To Network</label>
                <Select value={toChain} onValueChange={setToChain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedChains
                      .filter(c => c.status === 'active' && c.id !== fromChain)
                      .map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.logo} {chain.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            {selectedFromChain && selectedToChain && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bridge Fee:</span>
                    <span>{selectedToChain.bridgeFee} {selectedToChain.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Time:</span>
                    <span>{selectedToChain.estimatedTime}</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleBridge}
              disabled={!account || bridging || !selectedAsset || !toChain || !amount}
            >
              {bridging ? "Bridging..." : "Bridge Asset"}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your cross-chain transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => {
                const fromChainData = getChain(tx.from_chain);
                const toChainData = getChain(tx.to_chain);
                
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{fromChainData?.logo}</span>
                      <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                      <span>{toChainData?.logo}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium">{tx.amount} Asset Tokens</div>
                      <div className="text-xs text-muted-foreground">
                        {fromChainData?.name} → {toChainData?.name}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <Badge variant="outline" className="text-xs capitalize">
                        {tx.status}
                      </Badge>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="p-1">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}