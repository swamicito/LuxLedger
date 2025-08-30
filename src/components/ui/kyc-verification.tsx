import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/ui/file-upload";
import { CheckCircle, Upload, AlertCircle, Clock, Shield, User, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const kycSchema = z.object({
  document_type: z.enum(["passport", "drivers_license", "national_id"]),
  document_url: z.string().min(1, "Document upload is required"),
  notes: z.string().optional(),
});

type KYCFormData = z.infer<typeof kycSchema>;

export function KYCVerification() {
  const [documentUrl, setDocumentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
  });

  // Fetch existing KYC submission
  const { data: kycSubmission, isLoading } = useQuery({
    queryKey: ["kyc-submission", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const onSubmit = async (data: KYCFormData) => {
    if (!user) {
      toast.error("Please sign in to submit KYC verification");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("kyc_submissions")
        .insert({
          user_id: user.id,
          document_type: data.document_type,
          document_url: documentUrl,
          notes: data.notes,
          status: "pending",
        });

      if (error) throw error;

      toast.success("KYC submission successful! Your documents are being reviewed.");
      form.reset();
      setDocumentUrl("");
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error("Failed to submit KYC. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kycSubmission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            KYC Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(kycSubmission.status)}
              <span className="font-medium capitalize">
                {kycSubmission.status.replace("_", " ")}
              </span>
            </div>
            <Badge className={getStatusColor(kycSubmission.status)}>
              {kycSubmission.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Document Type</Label>
              <p className="capitalize">
                {kycSubmission.document_type.replace("_", " ")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Submitted</Label>
              <p>{new Date(kycSubmission.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {kycSubmission.status === "rejected" && kycSubmission.rejection_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <Label className="text-sm font-medium text-red-800">
                Rejection Reason
              </Label>
              <p className="text-sm text-red-700 mt-1">
                {kycSubmission.rejection_reason}
              </p>
            </div>
          )}

          {kycSubmission.status === "pending" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Review Progress</span>
                <span>In Review</span>
              </div>
              <Progress value={50} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Your documents are being reviewed. This typically takes 1-3 business days.
              </p>
            </div>
          )}

          {kycSubmission.status === "rejected" && (
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Submit New Documents
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          KYC Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete your identity verification to access all platform features
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="document_type">Document Type</Label>
            <Select 
              onValueChange={(value) => form.setValue("document_type", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.document_type && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.document_type.message}
              </p>
            )}
          </div>

          <div>
            <Label>Document Upload</Label>
            <FileUpload
              onUpload={(urls) => {
                setDocumentUrl(urls[0]);
                form.setValue("document_url", urls[0]);
              }}
              accept="image/*,.pdf"
              maxSize={10 * 1024 * 1024} // 10MB
            />
            {form.formState.errors.document_url && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.document_url.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              {...form.register("notes")}
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">
                  Document Requirements
                </p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• Document must be clear and readable</li>
                  <li>• All four corners must be visible</li>
                  <li>• Document must be valid and not expired</li>
                  <li>• Supported formats: JPEG, PNG, PDF</li>
                </ul>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !documentUrl} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}