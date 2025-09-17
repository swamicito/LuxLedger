import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  MessageSquare,
  Gavel
} from 'lucide-react';
import { escrowManager, type EscrowDetails, type EscrowStatus } from '../lib/escrow-core';
import { disputeResolutionDAO, type DisputeCase } from '../lib/dispute-resolution';

interface EscrowDashboardProps {
  userAddress: string;
  className?: string;
}

export function EscrowDashboard({ userAddress, className = '' }: EscrowDashboardProps) {
  const [escrows, setEscrows] = useState<EscrowDetails[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userAddress]);

  const loadUserData = async () => {
    try {
      const userEscrows = escrowManager.getUserEscrows(userAddress);
      const userDisputes = Array.from(disputeResolutionDAO['disputes'].values())
        .filter(d => {
          const escrow = escrowManager.getEscrow(d.escrowId);
          return escrow && (escrow.buyerAddress === userAddress || escrow.sellerAddress === userAddress);
        });

      setEscrows(userEscrows);
      setDisputes(userDisputes);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: EscrowStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'locked': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'released': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'resolved': return <Gavel className="w-4 h-4 text-purple-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: EscrowStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'locked': return 'bg-blue-100 text-blue-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirmDelivery = async (escrowId: string) => {
    try {
      await escrowManager.confirmCondition(escrowId, 'delivery_confirmation', userAddress);
      loadUserData();
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };

  const handleInitiateDispute = async (escrowId: string) => {
    // This would open a dispute modal in a real implementation
    console.log('Initiating dispute for escrow:', escrowId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
          <p style={{ color: 'var(--ivory)' }}>Loading escrow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
          LuxGuard Escrow Dashboard
        </h2>
        <Badge variant="outline" className="text-sm">
          {escrows.length} Active Escrows
        </Badge>
      </div>

      <Tabs defaultValue="escrows" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="escrows">My Escrows</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="escrows" className="space-y-4">
          {escrows.length === 0 ? (
            <Card style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--gold)' }} />
                <p style={{ color: 'var(--ivory)' }}>No escrows found</p>
                <p className="text-sm mt-2" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
                  Your escrow transactions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            escrows.map((escrow) => (
              <Card key={escrow.escrowId} style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(escrow.status)}
                      <span style={{ color: 'var(--ivory)' }}>
                        Escrow #{escrow.escrowId.slice(-8)}
                      </span>
                    </CardTitle>
                    <Badge className={getStatusColor(escrow.status)}>
                      {escrow.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--gold)' }}>Amount:</span>
                      <div style={{ color: 'var(--ivory)' }}>${escrow.amountUSD.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--gold)' }}>Chain:</span>
                      <div style={{ color: 'var(--ivory)' }}>{escrow.chain.toUpperCase()}</div>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--gold)' }}>Role:</span>
                      <div style={{ color: 'var(--ivory)' }}>
                        {escrow.buyerAddress === userAddress ? 'Buyer' : 'Seller'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--gold)' }}>Expires:</span>
                      <div style={{ color: 'var(--ivory)' }}>
                        {new Date(escrow.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div>
                    <span className="font-medium text-sm" style={{ color: 'var(--gold)' }}>Conditions:</span>
                    <div className="mt-2 space-y-2">
                      {escrow.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--lux-black)' }}>
                          <div className="flex items-center space-x-2">
                            {condition.fulfilled ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm" style={{ color: 'var(--ivory)' }}>
                              {condition.description}
                            </span>
                          </div>
                          {!condition.fulfilled && escrow.buyerAddress === userAddress && condition.type === 'delivery_confirmation' && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmDelivery(escrow.escrowId)}
                              className="btn-gold text-xs"
                            >
                              Confirm
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {escrow.status === 'locked' && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInitiateDispute(escrow.escrowId)}
                        style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Dispute
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          {disputes.length === 0 ? (
            <Card style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
              <CardContent className="text-center py-8">
                <Gavel className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--gold)' }} />
                <p style={{ color: 'var(--ivory)' }}>No disputes found</p>
                <p className="text-sm mt-2" style={{ color: 'var(--ivory)', opacity: 0.7 }}>
                  Any dispute cases will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            disputes.map((dispute) => (
              <Card key={dispute.disputeId} style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: 'var(--ivory)' }}>
                      {dispute.title}
                    </CardTitle>
                    <Badge className={`${dispute.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {dispute.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: 'var(--ivory)' }}>
                      {dispute.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium" style={{ color: 'var(--gold)' }}>Amount:</span>
                        <div style={{ color: 'var(--ivory)' }}>${dispute.amountUSD.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: 'var(--gold)' }}>Category:</span>
                        <div style={{ color: 'var(--ivory)' }}>{dispute.category}</div>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: 'var(--gold)' }}>Votes:</span>
                        <div style={{ color: 'var(--ivory)' }}>{dispute.votes.length}/{dispute.assignedArbitrators.length}</div>
                      </div>
                    </div>
                    {dispute.resolution && (
                      <div className="p-3 rounded" style={{ backgroundColor: 'var(--lux-black)' }}>
                        <div className="font-medium text-sm mb-2" style={{ color: 'var(--gold)' }}>Resolution:</div>
                        <p className="text-sm" style={{ color: 'var(--ivory)' }}>
                          {dispute.resolution.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
