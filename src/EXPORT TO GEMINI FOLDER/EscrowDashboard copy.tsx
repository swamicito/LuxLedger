/**
 * Escrow Tracking Dashboard
 * Displays active escrows, transaction history, and management controls
 */

import React, { useState, useEffect } from 'react';
import { useEscrowAuth, useEscrowWallet } from '@/hooks/use-escrow-auth';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface EscrowItem {
  id: string;
  assetName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
  expiresAt: string;
  buyerAddress: string;
  sellerAddress: string;
  chain: string;
  txHash?: string;
  sequence?: number;
}

const mockEscrows: EscrowItem[] = [
  {
    id: 'esc_001',
    assetName: 'Rolex Submariner Date',
    amount: 12500,
    currency: 'USD',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-02-15T10:30:00Z',
    buyerAddress: 'rBuyer123...',
    sellerAddress: 'rSeller456...',
    chain: 'XRPL',
    txHash: 'ABC123DEF456',
    sequence: 12345
  },
  {
    id: 'esc_002',
    assetName: 'Cartier Love Bracelet',
    amount: 8900,
    currency: 'USD',
    status: 'pending',
    createdAt: '2024-01-20T14:15:00Z',
    expiresAt: '2024-02-20T14:15:00Z',
    buyerAddress: 'rBuyer789...',
    sellerAddress: 'rSeller012...',
    chain: 'XRPL',
    sequence: 12346
  }
];

export default function EscrowDashboard() {
  const { walletAddress } = useEscrowAuth();
  const { getEscrowStatus, finishEscrow, cancelEscrow } = useEscrowWallet();
  const [escrows, setEscrows] = useState<EscrowItem[]>(mockEscrows);
  const [filteredEscrows, setFilteredEscrows] = useState<EscrowItem[]>(mockEscrows);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    filterEscrows();
  }, [escrows, statusFilter, searchQuery]);

  const filterEscrows = () => {
    let filtered = escrows;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(escrow => escrow.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(escrow => 
        escrow.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        escrow.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEscrows(filtered);
  };

  const refreshEscrows = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      // In production, fetch real escrows from API
      toast.success('Escrows refreshed');
    } catch (error) {
      toast.error('Failed to refresh escrows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishEscrow = async (escrow: EscrowItem) => {
    try {
      setIsLoading(true);
      await finishEscrow({
        owner: escrow.sellerAddress,
        sequence: escrow.sequence
      });
      
      setEscrows(prev => prev.map(e => 
        e.id === escrow.id ? { ...e, status: 'completed' } : e
      ));
      
      toast.success('Escrow completed successfully');
    } catch (error) {
      toast.error('Failed to complete escrow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEscrow = async (escrow: EscrowItem) => {
    try {
      setIsLoading(true);
      await cancelEscrow({
        owner: escrow.sellerAddress,
        sequence: escrow.sequence
      });
      
      setEscrows(prev => prev.map(e => 
        e.id === escrow.id ? { ...e, status: 'cancelled' } : e
      ));
      
      toast.success('Escrow cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel escrow');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'disputed':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--lux-gold)' }}>
              Escrow Dashboard
            </h1>
            <p className="text-gray-400 mb-8">
              Connect your wallet to view and manage your escrows
            </p>
            <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--lux-gold)' }}>
              Escrow Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your secure transactions and escrow contracts
            </p>
          </div>
          
          <button
            onClick={refreshEscrows}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Escrows', value: escrows.filter(e => e.status === 'active').length, color: 'blue' },
            { label: 'Pending', value: escrows.filter(e => e.status === 'pending').length, color: 'yellow' },
            { label: 'Completed', value: escrows.filter(e => e.status === 'completed').length, color: 'green' },
            { label: 'Total Value', value: formatCurrency(escrows.reduce((sum, e) => sum + e.amount, 0), 'USD'), color: 'gold' }
          ].map((stat, index) => (
            <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ 
                color: stat.color === 'gold' ? 'var(--lux-gold)' : 
                       stat.color === 'blue' ? '#3B82F6' :
                       stat.color === 'yellow' ? '#EAB308' :
                       stat.color === 'green' ? '#10B981' : 'white'
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search escrows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white flex-1"
            />
          </div>
        </div>

        {/* Escrow List */}
        <div className="space-y-4">
          {filteredEscrows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No escrows found</p>
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all">
                Create First Escrow
              </button>
            </div>
          ) : (
            filteredEscrows.map((escrow) => (
              <div key={escrow.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(escrow.status)}
                      <h3 className="text-xl font-semibold">{escrow.assetName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                        {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <p className="font-medium">Amount</p>
                        <p className="text-white">{formatCurrency(escrow.amount, escrow.currency)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Created</p>
                        <p className="text-white">{formatDate(escrow.createdAt)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Expires</p>
                        <p className="text-white">{formatDate(escrow.expiresAt)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                      <div>
                        <p className="font-medium">Buyer</p>
                        <p className="text-white font-mono">{escrow.buyerAddress}</p>
                      </div>
                      <div>
                        <p className="font-medium">Seller</p>
                        <p className="text-white font-mono">{escrow.sellerAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {escrow.txHash && (
                      <a
                        href={`https://testnet.xrpl.org/transactions/${escrow.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on XRPL
                      </a>
                    )}
                    
                    {escrow.status === 'active' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFinishEscrow(escrow)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancelEscrow(escrow)}
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {escrow.status === 'pending' && (
                      <button
                        onClick={() => handleCancelEscrow(escrow)}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--lux-gold)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all">
              Create New Escrow
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              View Dispute Center
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Export History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
