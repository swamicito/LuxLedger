import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/use-analytics";

interface KYCSubmission {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export function AdminDashboard() {
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const queryClient = useQueryClient();
  const { getDashboardMetrics, getAssetPerformance, getUserEngagement } = useAnalytics();

  // Fetch dashboard metrics
  const { data: metrics } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: getDashboardMetrics,
  });

  // Fetch KYC submissions
  const { data: kycSubmissions, isLoading: kycLoading } = useQuery({
    queryKey: ["admin-kyc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any;
    },
  });

  // Fetch assets for management
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ["admin-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // KYC Review Mutation
  const reviewKYCMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      action, 
      reason 
    }: { 
      submissionId: string; 
      action: 'approve' | 'reject'; 
      reason?: string 
    }) => {
      const { error } = await supabase
        .from("kyc_submissions")
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          rejection_reason: action === 'reject' ? reason : null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kyc"] });
      toast.success("KYC submission reviewed successfully");
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to review KYC submission");
    },
  });

  const handleReviewKYC = (submission: KYCSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!selectedSubmission || !reviewAction) return;

    reviewKYCMutation.mutate({
      submissionId: selectedSubmission.id,
      action: reviewAction,
      reason: reviewAction === 'reject' ? rejectionReason : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const { color, icon: Icon } = config[status as keyof typeof config] || config.pending;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.new_users_month || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_assets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.verified_assets || 0} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_transactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${metrics?.transaction_volume?.toLocaleString() || 0} volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Pending</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kycSubmissions?.filter(k => k.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="kyc" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kyc">KYC Reviews</TabsTrigger>
          <TabsTrigger value="assets">Asset Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="kyc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KYC Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {kycLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycSubmissions?.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{submission.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {submission.profiles?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {submission.document_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {new Date(submission.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(submission.document_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {submission.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleReviewKYC(submission, 'approve')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleReviewKYC(submission, 'reject')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
            </CardHeader>
            <CardContent>
              {assetsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets?.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.title}</TableCell>
                        <TableCell className="capitalize">
                          {asset.category.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {asset.currency} {asset.estimated_value?.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        <TableCell>{asset.owner_id || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} KYC Submission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSubmission && (
              <div className="space-y-2">
                <p><strong>User:</strong> {selectedSubmission.profiles?.full_name}</p>
                <p><strong>Document:</strong> {selectedSubmission.document_type.replace('_', ' ')}</p>
              </div>
            )}
            
            {reviewAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmReview}
                disabled={reviewAction === 'reject' && !rejectionReason.trim()}
                className={reviewAction === 'approve' ? '' : 'bg-red-600 hover:bg-red-700'}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}