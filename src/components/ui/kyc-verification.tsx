import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/ui/file-upload";
import { CheckCircle, AlertCircle, Clock, Shield, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
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
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-300" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
      case "rejected":
        return "border border-red-500/40 bg-red-500/10 text-red-300";
      case "pending":
        return "border border-amber-500/40 bg-amber-500/10 text-amber-200";
      default:
        return "border border-slate-500/40 bg-slate-500/10 text-slate-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-5 w-40 rounded-full bg-white/10" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kycSubmission) {
    return (
      <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/90 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
                  Identity verification
                </p>
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
                  KYC Verification Status
                </CardTitle>
              </div>
            </div>
            <Badge className={`hidden sm:inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wide ${getStatusColor(kycSubmission.status)}`}>
              {kycSubmission.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-7 pb-6 sm:pb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                {getStatusIcon(kycSubmission.status)}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Current status</p>
                <p className="text-sm font-semibold capitalize">
                  {kycSubmission.status.replace("_", " ")}
                </p>
              </div>
            </div>
            <Badge className={`inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wide sm:hidden ${getStatusColor(kycSubmission.status)}`}>
              {kycSubmission.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2 sm:gap-6">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Document type
              </Label>
              <p className="text-sm capitalize">
                {kycSubmission.document_type.replace("_", " ")}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Submitted
              </Label>
              <p className="text-sm">
                {new Date(kycSubmission.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {kycSubmission.status === "rejected" && kycSubmission.rejection_reason && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 sm:p-5">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
                Rejection reason
              </Label>
              <p className="mt-2 text-sm text-red-100">
                {kycSubmission.rejection_reason}
              </p>
            </div>
          )}

          {kycSubmission.status === "pending" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                <span>Review progress</span>
                <span className="font-medium text-amber-200">In review</span>
              </div>
              <Progress value={50} className="h-2 overflow-hidden rounded-full bg-white/10" />
              <p className="text-xs text-muted-foreground">
                Your documents are being reviewed. This typically takes 1–3 business days.
              </p>
            </div>
          )}

          {kycSubmission.status === "rejected" && (
            <Button
              onClick={() => window.location.reload()}
              className="mt-2 w-full rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] transition-colors hover:bg-amber-400"
            >
              Submit New Documents
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
                Identity verification
              </p>
              <CardTitle className="mt-1 text-base sm:text-lg font-semibold tracking-tight">
                KYC Verification
              </CardTitle>
            </div>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-muted-foreground">
            Complete your identity verification to unlock premium features, higher limits,
            and seamless settlement across your LuxLedger portfolio.
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-6 sm:pb-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="document_type" className="text-xs uppercase tracking-[0.18em]">
                  Document type
                </Label>
                <Select
                  onValueChange={(value) => form.setValue("document_type", value as any)}
                >
                  <SelectTrigger id="document_type" className="bg-black/40">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-neutral-950">
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.document_type && (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.document_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em]">
                  Document upload
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload a clear, high-resolution scan or photo of your document. Files are encrypted in transit.
                </p>
                <FileUpload
                  onUpload={(urls) => {
                    setDocumentUrl(urls[0]);
                    form.setValue("document_url", urls[0]);
                  }}
                  accept="image/*,.pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                />
                {form.formState.errors.document_url && (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.document_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs uppercase tracking-[0.18em]">
                  Additional notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information that might help our compliance team review your submission."
                  className="min-h-[96px] bg-black/40"
                  {...form.register("notes")}
                />
              </div>
            </div>

            <div className="mt-2 space-y-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5 lg:mt-0">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertCircle className="h-5 w-5 text-amber-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Document requirements
                  </p>
                  <ul className="mt-1 space-y-1.5 text-xs text-amber-100/90">
                    <li>• Document must be clear, in focus, and readable.</li>
                    <li>• All four corners must be fully visible.</li>
                    <li>• Document must be valid and not expired.</li>
                    <li>• Supported formats: JPEG, PNG, PDF (max 10MB).</li>
                  </ul>
                </div>
              </div>
              <p className="text-[0.7rem] text-amber-100/80">
                Your information is encrypted and handled in accordance with our privacy and
                compliance policies.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !documentUrl}
            className="w-full rounded-full bg-amber-500 text-black shadow-[0_18px_45px_rgba(0,0,0,0.7)] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}