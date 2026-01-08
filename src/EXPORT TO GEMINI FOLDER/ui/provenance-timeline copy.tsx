import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Shield, 
  ExternalLink, 
  Search,
  Filter,
  Download,
  Share,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

interface ProvenanceEvent {
  id: string;
  timestamp: Date;
  type: 'creation' | 'ownership_transfer' | 'authentication' | 'appraisal' | 'exhibition' | 'restoration' | 'insurance' | 'legal' | 'tokenization';
  title: string;
  description: string;
  location?: string;
  participants: {
    name: string;
    role: string;
    verified: boolean;
    walletAddress?: string;
  }[];
  documents: {
    name: string;
    type: string;
    hash: string;
    verified: boolean;
    url?: string;
  }[];
  verification: {
    status: 'verified' | 'pending' | 'disputed';
    verifiedBy?: string;
    confidence: number;
    sources: string[];
  };
  blockchain: {
    network: string;
    transactionHash?: string;
    blockNumber?: number;
    confirmations?: number;
  };
  metadata?: Record<string, any>;
}

interface ProvenanceTimelineProps {
  assetId: string;
  assetTitle: string;
  events?: ProvenanceEvent[];
  showFilters?: boolean;
  compact?: boolean;
}

const MOCK_EVENTS: ProvenanceEvent[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-22T10:00:00Z'),
    type: 'tokenization',
    title: 'Asset Tokenized on XRPL',
    description: 'Luxury asset successfully tokenized and minted as NFT on XRP Ledger',
    location: 'Digital',
    participants: [
      { name: 'LuxLedger Platform', role: 'Tokenization Service', verified: true, walletAddress: 'rLuxLedgerPlatform123456789' }
    ],
    documents: [
      { name: 'Tokenization Certificate', type: 'certificate', hash: '0x1a2b3c...', verified: true },
      { name: 'Smart Contract Code', type: 'contract', hash: '0x4d5e6f...', verified: true }
    ],
    verification: {
      status: 'verified',
      verifiedBy: 'XRPL Network',
      confidence: 100,
      sources: ['XRPL Ledger', 'Smart Contract Audit']
    },
    blockchain: {
      network: 'XRPL',
      transactionHash: '0xABC123DEF456...',
      blockNumber: 85432109,
      confirmations: 1250
    }
  },
  {
    id: '2',
    timestamp: new Date('2024-01-20T14:30:00Z'),
    type: 'appraisal',
    title: 'Professional Appraisal Completed',
    description: 'Independent appraisal conducted by certified luxury goods appraiser',
    location: 'New York, NY',
    participants: [
      { name: 'Sarah Mitchell', role: 'Certified Appraiser', verified: true },
      { name: 'Elite Appraisals LLC', role: 'Appraisal Company', verified: true }
    ],
    documents: [
      { name: 'Appraisal Report', type: 'report', hash: '0x7g8h9i...', verified: true },
      { name: 'Appraiser Certification', type: 'certificate', hash: '0xj1k2l3...', verified: true }
    ],
    verification: {
      status: 'verified',
      verifiedBy: 'American Society of Appraisers',
      confidence: 95,
      sources: ['ASA Database', 'Professional License Verification']
    },
    blockchain: {
      network: 'XRPL',
      transactionHash: '0xDEF456GHI789...',
      blockNumber: 85431890,
      confirmations: 1469
    }
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T09:15:00Z'),
    type: 'authentication',
    title: 'Authenticity Verification',
    description: 'Item authenticated using advanced forensic analysis and brand verification',
    location: 'Geneva, Switzerland',
    participants: [
      { name: 'Dr. James Wilson', role: 'Authentication Expert', verified: true },
      { name: 'Swiss Authentication Institute', role: 'Certification Body', verified: true }
    ],
    documents: [
      { name: 'Authentication Certificate', type: 'certificate', hash: '0xm4n5o6...', verified: true },
      { name: 'Forensic Analysis Report', type: 'report', hash: '0xp7q8r9...', verified: true },
      { name: 'Brand Verification Letter', type: 'letter', hash: '0xs1t2u3...', verified: true }
    ],
    verification: {
      status: 'verified',
      verifiedBy: 'Swiss Authentication Institute',
      confidence: 98,
      sources: ['Forensic Analysis', 'Brand Database', 'Expert Opinion']
    },
    blockchain: {
      network: 'XRPL',
      transactionHash: '0xGHI789JKL012...',
      blockNumber: 85430654,
      confirmations: 2705
    }
  },
  {
    id: '4',
    timestamp: new Date('2023-12-10T16:45:00Z'),
    type: 'ownership_transfer',
    title: 'Ownership Transfer',
    description: 'Asset acquired from previous owner with full documentation',
    location: 'London, UK',
    participants: [
      { name: 'Michael Chen', role: 'Previous Owner', verified: true, walletAddress: 'rPreviousOwner123456789' },
      { name: 'Current Owner', role: 'New Owner', verified: true, walletAddress: 'rCurrentOwner987654321' },
      { name: 'Heritage Auction House', role: 'Facilitator', verified: true }
    ],
    documents: [
      { name: 'Bill of Sale', type: 'contract', hash: '0xv4w5x6...', verified: true },
      { name: 'Transfer Certificate', type: 'certificate', hash: '0xy7z8a9...', verified: true },
      { name: 'Insurance Transfer', type: 'insurance', hash: '0xb1c2d3...', verified: true }
    ],
    verification: {
      status: 'verified',
      verifiedBy: 'Heritage Auction House',
      confidence: 92,
      sources: ['Auction Records', 'Legal Documentation', 'Payment Verification']
    },
    blockchain: {
      network: 'XRPL',
      transactionHash: '0xJKL012MNO345...',
      blockNumber: 85398432,
      confirmations: 34927
    }
  },
  {
    id: '5',
    timestamp: new Date('2020-03-22T11:20:00Z'),
    type: 'creation',
    title: 'Original Creation',
    description: 'Item originally created by master craftsman with documented provenance',
    location: 'Florence, Italy',
    participants: [
      { name: 'Antonio Rossi', role: 'Master Craftsman', verified: true },
      { name: 'Rossi Atelier', role: 'Workshop', verified: true }
    ],
    documents: [
      { name: 'Creation Certificate', type: 'certificate', hash: '0xe4f5g6...', verified: true },
      { name: 'Material Sourcing Records', type: 'record', hash: '0xh7i8j9...', verified: true },
      { name: 'Craftsman Signature', type: 'signature', hash: '0xk1l2m3...', verified: true }
    ],
    verification: {
      status: 'verified',
      verifiedBy: 'Italian Artisan Guild',
      confidence: 90,
      sources: ['Guild Records', 'Workshop Documentation', 'Material Certificates']
    },
    blockchain: {
      network: 'XRPL',
      transactionHash: '0xMNO345PQR678...',
      blockNumber: 85200000,
      confirmations: 232109
    }
  }
];

export const ProvenanceTimeline = ({ 
  assetId, 
  assetTitle, 
  events = MOCK_EVENTS, 
  showFilters = true,
  compact = false 
}: ProvenanceTimelineProps) => {
  const { t } = useTranslation();
  const [filteredEvents, setFilteredEvents] = useState<ProvenanceEvent[]>(events);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, selectedType, selectedStatus, events]);

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.verification.status === selectedStatus);
    }

    setFilteredEvents(filtered);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'creation': return '🎨';
      case 'ownership_transfer': return '🤝';
      case 'authentication': return '🔍';
      case 'appraisal': return '💎';
      case 'exhibition': return '🏛️';
      case 'restoration': return '🔧';
      case 'insurance': return '🛡️';
      case 'legal': return '⚖️';
      case 'tokenization': return '🪙';
      default: return '📋';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'creation': return 'bg-purple-100 text-purple-800';
      case 'ownership_transfer': return 'bg-blue-100 text-blue-800';
      case 'authentication': return 'bg-green-100 text-green-800';
      case 'appraisal': return 'bg-yellow-100 text-yellow-800';
      case 'exhibition': return 'bg-pink-100 text-pink-800';
      case 'restoration': return 'bg-orange-100 text-orange-800';
      case 'insurance': return 'bg-indigo-100 text-indigo-800';
      case 'legal': return 'bg-red-100 text-red-800';
      case 'tokenization': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'disputed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleExportTimeline = () => {
    const data = {
      assetId,
      assetTitle,
      exportDate: new Date().toISOString(),
      events: filteredEvents
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assetTitle}_provenance_timeline.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Provenance timeline exported');
  };

  const handleShareTimeline = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${assetTitle} - Provenance Timeline`,
          text: `View the complete provenance history of ${assetTitle}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Timeline link copied to clipboard');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-2xl">{getEventTypeIcon(event.type)}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getVerificationIcon(event.verification.status)}
                  <span className="text-xs text-muted-foreground">
                    {event.verification.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Full Timeline
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Provenance Timeline
              </CardTitle>
              <CardDescription>
                Complete ownership and authentication history for {assetTitle}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareTimeline}>
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportTimeline}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="creation">Creation</option>
                <option value="ownership_transfer">Ownership Transfer</option>
                <option value="authentication">Authentication</option>
                <option value="appraisal">Appraisal</option>
                <option value="tokenization">Tokenization</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="disputed">Disputed</option>
              </select>

              <div className="text-sm text-muted-foreground flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                {filteredEvents.length} events
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className="p-0">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
            
            <div className="space-y-0">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-4 h-4 bg-background border-2 border-primary rounded-full z-10 mt-6"></div>
                  
                  <div className="ml-16 p-6 border-b last:border-b-0">
                    <div className="space-y-4">
                      {/* Event Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(event.timestamp)}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3">{event.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getVerificationIcon(event.verification.status)}
                            <span className="text-sm font-medium">
                              {event.verification.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <Tabs defaultValue="participants" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="participants">Participants</TabsTrigger>
                          <TabsTrigger value="documents">Documents</TabsTrigger>
                          <TabsTrigger value="verification">Verification</TabsTrigger>
                          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                        </TabsList>

                        <TabsContent value="participants" className="mt-4">
                          <div className="space-y-2">
                            {event.participants.map((participant, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <div>
                                    <span className="font-medium">{participant.name}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({participant.role})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {participant.verified && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                  {participant.walletAddress && (
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {participant.walletAddress.slice(0, 8)}...
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="documents" className="mt-4">
                          <div className="space-y-2">
                            {event.documents.map((doc, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <div>
                                    <span className="font-medium">{doc.name}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({doc.type})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {doc.verified && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                  <Badge variant="outline" className="text-xs font-mono">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {doc.hash.slice(0, 8)}...
                                  </Badge>
                                  {doc.url && (
                                    <Button variant="ghost" size="sm">
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="verification" className="mt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Status:</span>
                              <div className="flex items-center gap-2">
                                {getVerificationIcon(event.verification.status)}
                                <span className="capitalize">{event.verification.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Confidence:</span>
                              <span className="font-semibold">{event.verification.confidence}%</span>
                            </div>
                            {event.verification.verifiedBy && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Verified by:</span>
                                <span>{event.verification.verifiedBy}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium">Sources:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {event.verification.sources.map((source, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="blockchain" className="mt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Network:</span>
                              <Badge>{event.blockchain.network}</Badge>
                            </div>
                            {event.blockchain.transactionHash && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Transaction:</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {event.blockchain.transactionHash.slice(0, 12)}...
                                  </Badge>
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {event.blockchain.blockNumber && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Block:</span>
                                <span className="font-mono">#{event.blockchain.blockNumber.toLocaleString()}</span>
                              </div>
                            )}
                            {event.blockchain.confirmations && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Confirmations:</span>
                                <span className="font-semibold text-green-600">
                                  {event.blockchain.confirmations.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
