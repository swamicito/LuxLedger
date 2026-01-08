/**
 * Dispute Center - Manage escrow disputes and issue resolution
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Upload,
  FileText,
  Shield,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { DisputeTimeline, TrustBadge } from "@/components/ui/trust-signals";
import { ContextualHelp } from "@/components/ui/escape-hatches";

interface Dispute {
  id: string;
  escrowId: string;
  assetName: string;
  amount: number;
  reason: string;
  status: "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "escalated";
  createdAt: string;
  updatedAt: string;
  description: string;
  evidence: string[];
  messages: { sender: string; message: string; timestamp: string }[];
}

const mockDisputes: Dispute[] = [
  {
    id: "disp_001",
    escrowId: "esc_001",
    assetName: "Rolex Submariner Date",
    amount: 12500,
    reason: "item_not_as_described",
    status: "under_review",
    createdAt: "2024-01-18T10:30:00Z",
    updatedAt: "2024-01-19T14:00:00Z",
    description: "The watch received has visible scratches on the bezel that were not shown in the listing photos.",
    evidence: ["photo1.jpg", "photo2.jpg"],
    messages: [
      { sender: "buyer", message: "The watch has scratches not shown in listing", timestamp: "2024-01-18T10:30:00Z" },
      { sender: "support", message: "Thank you for reporting. We're reviewing the evidence.", timestamp: "2024-01-18T12:00:00Z" },
    ],
  },
];

const disputeReasons = [
  { value: "item_not_received", label: "Item not received" },
  { value: "item_not_as_described", label: "Item not as described" },
  { value: "item_damaged", label: "Item damaged during shipping" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "counterfeit", label: "Suspected counterfeit" },
  { value: "other", label: "Other issue" },
];

export default function DisputeCenter() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [activeTab, setActiveTab] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewDispute, setShowNewDispute] = useState(false);
  const [newDispute, setNewDispute] = useState({
    escrowId: "",
    reason: "",
    description: "",
  });

  const getStatusBadge = (status: Dispute["status"]) => {
    switch (status) {
      case "open":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Open</Badge>;
      case "under_review":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Under Review</Badge>;
      case "resolved_buyer":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resolved - Refunded</Badge>;
      case "resolved_seller":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resolved - Released</Badge>;
      case "escalated":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Escalated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: Dispute["status"]) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "under_review":
        return <RefreshCw className="h-4 w-4 text-blue-400" />;
      case "resolved_buyer":
      case "resolved_seller":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "escalated":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSubmitDispute = async () => {
    if (!newDispute.escrowId || !newDispute.reason || !newDispute.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const dispute: Dispute = {
        id: `disp_${Date.now()}`,
        escrowId: newDispute.escrowId,
        assetName: "Pending Asset", // Would be fetched from escrow
        amount: 0,
        reason: newDispute.reason,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: newDispute.description,
        evidence: [],
        messages: [],
      };

      setDisputes((prev) => [dispute, ...prev]);
      setShowNewDispute(false);
      setNewDispute({ escrowId: "", reason: "", description: "" });
      toast.success("Dispute submitted successfully. Case #" + dispute.id);
    } catch (error) {
      toast.error("Failed to submit dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeDisputes = disputes.filter((d) => ["open", "under_review", "escalated"].includes(d.status));
  const resolvedDisputes = disputes.filter((d) => ["resolved_buyer", "resolved_seller"].includes(d.status));

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/escrow/dashboard")}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  DISPUTE CENTER
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Resolution · Mediation · Protection
                </p>
              </div>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Active</p>
                <p className="text-lg font-semibold" style={{ color: activeDisputes.length > 0 ? '#FBBF24' : '#F5F5F7' }}>
                  {activeDisputes.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Resolved</p>
                <p className="text-lg font-semibold" style={{ color: '#22C55E' }}>{resolvedDisputes.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Avg Time</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>48h</p>
              </div>
            </div>
            
            {/* Right: Help */}
            <ContextualHelp context="escrow" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">

        {/* Trust Banner */}
        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-300">Your funds are protected</p>
                <p className="text-xs text-emerald-300/70 mt-1">
                  While a dispute is open, your funds remain securely held in XRPL escrow—not by us. 
                  Our team reviews all evidence and makes a fair decision within 48-72 hours.
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-1">
                  <p className="text-xs text-emerald-300/80 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    You'll receive email updates at each stage
                  </p>
                  <p className="text-xs text-emerald-300/80 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    Funds only release after resolution
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border border-white/10 bg-neutral-950">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Active Disputes</p>
              <p className="text-2xl font-bold text-amber-400">{activeDisputes.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-neutral-950">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-400">{resolvedDisputes.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-neutral-950">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg Resolution</p>
              <p className="text-2xl font-bold">48h</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-neutral-950">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-400">94%</p>
            </CardContent>
          </Card>
        </div>

        {/* New Dispute Button */}
        <div className="flex justify-end">
          <Dialog open={showNewDispute} onOpenChange={setShowNewDispute}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 text-black hover:bg-amber-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report an Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg border border-white/10 bg-neutral-950">
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
                <DialogDescription>
                  Open a dispute for an escrow transaction. Provide as much detail as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="escrowId">Escrow ID</Label>
                  <Input
                    id="escrowId"
                    placeholder="e.g., esc_001"
                    value={newDispute.escrowId}
                    onChange={(e) => setNewDispute({ ...newDispute, escrowId: e.target.value })}
                    className="bg-black/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Dispute</Label>
                  <Select
                    value={newDispute.reason}
                    onValueChange={(value) => setNewDispute({ ...newDispute, reason: value })}
                  >
                    <SelectTrigger className="bg-black/40">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {disputeReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail. Include any relevant information about what you expected vs. what you received."
                    value={newDispute.description}
                    onChange={(e) => setNewDispute({ ...newDispute, description: e.target.value })}
                    className="bg-black/40 min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evidence (optional)</Label>
                  <div className="border border-dashed border-white/20 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop photos or documents, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JPG, PNG, PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDispute(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitDispute}
                  disabled={isSubmitting}
                  className="bg-amber-500 text-black hover:bg-amber-400"
                >
                  {isSubmitting ? "Submitting..." : "Submit Dispute"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Disputes List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-neutral-900">
            <TabsTrigger value="active">
              Active ({activeDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedDisputes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            {activeDisputes.length === 0 ? (
              <Card className="border border-white/10 bg-neutral-950">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Disputes</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any open disputes. If you have an issue with an escrow transaction,
                    click "Report an Issue" above.
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeDisputes.map((dispute) => (
                <Card key={dispute.id} className="border border-white/10 bg-neutral-950">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusIcon(dispute.status)}
                          <h3 className="font-semibold">{dispute.assetName}</h3>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-white">Case ID:</span> {dispute.id}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-white">Escrow:</span> {dispute.escrowId}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-white">Reason:</span>{" "}
                            {disputeReasons.find((r) => r.value === dispute.reason)?.label || dispute.reason}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-white">Opened:</span> {formatDate(dispute.createdAt)}
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {dispute.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="justify-start">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Messages ({dispute.messages.length})
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Add Evidence
                        </Button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Latest Update</p>
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5" />
                        <div>
                          <p className="text-sm">
                            {dispute.messages[dispute.messages.length - 1]?.message || "Dispute opened"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(dispute.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4 mt-4">
            {resolvedDisputes.length === 0 ? (
              <Card className="border border-white/10 bg-neutral-950">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Resolved Disputes</h3>
                  <p className="text-sm text-muted-foreground">
                    Resolved disputes will appear here for your records.
                  </p>
                </CardContent>
              </Card>
            ) : (
              resolvedDisputes.map((dispute) => (
                <Card key={dispute.id} className="border border-white/10 bg-neutral-950">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(dispute.status)}
                        <div>
                          <h3 className="font-semibold">{dispute.assetName}</h3>
                          <p className="text-sm text-muted-foreground">Case #{dispute.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(dispute.status)}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="border border-white/10 bg-neutral-950">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Need help with a dispute?</h3>
                <p className="text-sm text-muted-foreground">
                  Our support team is available to assist you with any questions.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/help")}>
                  Help Center
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/contact")}>
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
