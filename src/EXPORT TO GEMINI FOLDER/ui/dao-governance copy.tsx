import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vote, Users, Coins, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: 'platform_feature' | 'fee_structure' | 'partnership' | 'treasury' | 'governance';
  status: 'active' | 'passed' | 'rejected' | 'executed';
  proposer: string;
  created_at: string;
  voting_ends: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_votes: number;
  quorum_required: number;
  minimum_tokens: number;
}

interface UserTokens {
  total_tokens: number;
  voting_power: number;
  delegated_to: string | null;
  delegated_from: string[];
}

export function DAOGovernance() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: '',
    action: ''
  });
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [voting, setVoting] = useState<{ [key: string]: boolean }>({});
  
  const { user } = useAuth();

  useEffect(() => {
    loadProposals();
    loadUserTokens();
  }, [user]);

  const loadProposals = async () => {
    // Mock proposals data
    const mockProposals: Proposal[] = [
      {
        id: '1',
        title: 'Reduce marketplace fees from 2.5% to 2%',
        description: 'Proposal to reduce marketplace transaction fees to increase competitiveness and attract more high-value transactions.',
        category: 'fee_structure',
        status: 'active',
        proposer: '0x1234...5678',
        created_at: '2024-01-10T00:00:00Z',
        voting_ends: '2024-01-20T00:00:00Z',
        votes_for: 45000,
        votes_against: 12000,
        votes_abstain: 3000,
        total_votes: 60000,
        quorum_required: 50000,
        minimum_tokens: 1000
      },
      {
        id: '2',
        title: 'Add support for Solana blockchain',
        description: 'Expand cross-chain capabilities to include Solana ecosystem for faster and cheaper transactions.',
        category: 'platform_feature',
        status: 'active',
        proposer: '0xabcd...efgh',
        created_at: '2024-01-08T00:00:00Z',
        voting_ends: '2024-01-18T00:00:00Z',
        votes_for: 38000,
        votes_against: 25000,
        votes_abstain: 5000,
        total_votes: 68000,
        quorum_required: 50000,
        minimum_tokens: 1000
      },
      {
        id: '3',
        title: 'Partner with Christie\'s Auction House',
        description: 'Strategic partnership to expand luxury art offerings and increase platform credibility.',
        category: 'partnership',
        status: 'passed',
        proposer: '0x9876...5432',
        created_at: '2024-01-01T00:00:00Z',
        voting_ends: '2024-01-15T00:00:00Z',
        votes_for: 75000,
        votes_against: 15000,
        votes_abstain: 10000,
        total_votes: 100000,
        quorum_required: 50000,
        minimum_tokens: 1000
      }
    ];
    
    setProposals(mockProposals);
  };

  const loadUserTokens = async () => {
    if (!user) return;
    
    // Mock user tokens data
    setUserTokens({
      total_tokens: 2500,
      voting_power: 2500,
      delegated_to: null,
      delegated_from: []
    });
  };

  const vote = async (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    if (!userTokens) {
      toast.error("Token information not loaded");
      return;
    }

    if (userTokens.total_tokens < 100) {
      toast.error("Minimum 100 LUXG tokens required to vote");
      return;
    }

    setVoting(prev => ({ ...prev, [proposalId]: true }));

    try {
      // Simulate vote submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProposals(prev => prev.map(proposal => {
        if (proposal.id === proposalId) {
          const voteWeight = userTokens.voting_power;
          return {
            ...proposal,
            votes_for: voteType === 'for' ? proposal.votes_for + voteWeight : proposal.votes_for,
            votes_against: voteType === 'against' ? proposal.votes_against + voteWeight : proposal.votes_against,
            votes_abstain: voteType === 'abstain' ? proposal.votes_abstain + voteWeight : proposal.votes_abstain,
            total_votes: proposal.total_votes + voteWeight
          };
        }
        return proposal;
      }));

      toast.success(`Vote submitted successfully! You voted ${voteType.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to submit vote");
    } finally {
      setVoting(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const createProposal = async () => {
    if (!newProposal.title || !newProposal.description || !newProposal.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!userTokens || userTokens.total_tokens < 5000) {
      toast.error("Minimum 5,000 LUXG tokens required to create proposals");
      return;
    }

    try {
      // Simulate proposal creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const proposal: Proposal = {
        id: Date.now().toString(),
        title: newProposal.title,
        description: newProposal.description,
        category: newProposal.category as any,
        status: 'active',
        proposer: user?.id || 'unknown',
        created_at: new Date().toISOString(),
        voting_ends: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        votes_for: 0,
        votes_against: 0,
        votes_abstain: 0,
        total_votes: 0,
        quorum_required: 50000,
        minimum_tokens: 1000
      };

      setProposals(prev => [proposal, ...prev]);
      setNewProposal({ title: '', description: '', category: '', action: '' });
      setShowCreateProposal(false);
      
      toast.success("Proposal created successfully!");
    } catch (error) {
      toast.error("Failed to create proposal");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'executed': return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'passed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'executed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const isVotingActive = (proposal: Proposal) => {
    return proposal.status === 'active' && new Date(proposal.voting_ends) > new Date();
  };

  const formatTimeLeft = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Voting ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const filteredProposals = proposals.filter(p => 
    selectedTab === 'active' ? p.status === 'active' : p.status !== 'active'
  );

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            DAO Governance
          </CardTitle>
          <CardDescription>Please log in to participate in governance</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Vote className="w-6 h-6 text-primary" />
            DAO Governance
          </h2>
          <p className="text-muted-foreground">Shape the future of LuxLedger through community voting</p>
        </div>
        <Button onClick={() => setShowCreateProposal(true)}>
          Create Proposal
        </Button>
      </div>

      {/* User Governance Stats */}
      {userTokens && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{userTokens.total_tokens.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">LUXG Tokens</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{userTokens.voting_power.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Voting Power</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{userTokens.delegated_from.length}</div>
                  <div className="text-xs text-muted-foreground">Delegations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Votes Cast</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showCreateProposal && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Proposal</CardTitle>
            <CardDescription>Minimum 5,000 LUXG tokens required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Proposal title"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={newProposal.category}
                onValueChange={(value) => setNewProposal(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_feature">Platform Feature</SelectItem>
                  <SelectItem value="fee_structure">Fee Structure</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Detailed description of the proposal"
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={createProposal} className="flex-1">
                Create Proposal
              </Button>
              <Button variant="outline" onClick={() => setShowCreateProposal(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Tabs */}
      <div className="flex gap-2">
        <Button
          variant={selectedTab === 'active' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('active')}
        >
          Active Proposals ({proposals.filter(p => p.status === 'active').length})
        </Button>
        <Button
          variant={selectedTab === 'completed' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('completed')}
        >
          Completed Proposals ({proposals.filter(p => p.status !== 'active').length})
        </Button>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    <Badge variant="secondary" className="capitalize">
                      {proposal.category.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(proposal.status)}>
                      {getStatusIcon(proposal.status)}
                      <span className="ml-1 capitalize">{proposal.status}</span>
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {proposal.description}
                  </CardDescription>
                </div>
                
                {isVotingActive(proposal) && (
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{formatTimeLeft(proposal.voting_ends)}</div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Voting Results */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>For ({calculateVotePercentage(proposal.votes_for, proposal.total_votes)}%)</span>
                    <span>{proposal.votes_for.toLocaleString()} votes</span>
                  </div>
                  <Progress value={calculateVotePercentage(proposal.votes_for, proposal.total_votes)} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Against ({calculateVotePercentage(proposal.votes_against, proposal.total_votes)}%)</span>
                    <span>{proposal.votes_against.toLocaleString()} votes</span>
                  </div>
                  <Progress value={calculateVotePercentage(proposal.votes_against, proposal.total_votes)} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Abstain ({calculateVotePercentage(proposal.votes_abstain, proposal.total_votes)}%)</span>
                    <span>{proposal.votes_abstain.toLocaleString()} votes</span>
                  </div>
                  <Progress value={calculateVotePercentage(proposal.votes_abstain, proposal.total_votes)} className="h-2" />
                </div>

                {/* Quorum Progress */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Quorum Progress</span>
                  <span>{proposal.total_votes.toLocaleString()} / {proposal.quorum_required.toLocaleString()}</span>
                </div>
                <Progress value={Math.min(100, (proposal.total_votes / proposal.quorum_required) * 100)} className="h-1" />

                {/* Voting Buttons */}
                {isVotingActive(proposal) && userTokens && userTokens.total_tokens >= proposal.minimum_tokens && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => vote(proposal.id, 'for')}
                      disabled={voting[proposal.id]}
                      className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                    >
                      {voting[proposal.id] ? "Voting..." : "Vote For"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => vote(proposal.id, 'against')}
                      disabled={voting[proposal.id]}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {voting[proposal.id] ? "Voting..." : "Vote Against"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => vote(proposal.id, 'abstain')}
                      disabled={voting[proposal.id]}
                      className="flex-1"
                    >
                      {voting[proposal.id] ? "Voting..." : "Abstain"}
                    </Button>
                  </div>
                )}

                {isVotingActive(proposal) && userTokens && userTokens.total_tokens < proposal.minimum_tokens && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Minimum {proposal.minimum_tokens.toLocaleString()} LUXG tokens required to vote
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}