import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { Shield, Camera, ImageIcon, ChevronLeft, Save, CheckCircle, Video } from "lucide-react";
import { TrustBadge, VerificationStandards } from "@/components/ui/trust-signals";
import { EscapeHatches } from "@/components/ui/escape-hatches";
import { Progress } from "@/components/ui/progress";
import { ImageReorder } from "@/components/ui/image-reorder";
import { VideoUploadStep, VideoRequiredMessage } from "@/components/listing";
import { isVideoRequired, VIDEO_REQUIRED_THRESHOLD_USD } from "@/lib/video-verification";
import { uploadVideo } from "@/lib/storage";

type CategoryKey =
  | "jewelry"
  | "watches"
  | "art"
  | "real_estate"
  | "cars"
  | "wine"
  | "collectibles";

type RegionKey =
  | "global"
  | "north_america"
  | "europe"
  | "asia"
  | "middle_east"
  | "latin_america";

export default function ListAsset() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [region, setRegion] = useState<RegionKey>("global");
  const [images, setImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Parse price for video requirement check
  const priceUSD = Number(estimatedValue.replace(/,/g, "")) || 0;
  const videoRequired = isVideoRequired(priceUSD);
  const hasValidVideo = Boolean(videoUrl);

  // Calculate step progress (now 6 items for high-value, 5 for low-value)
  const getProgress = () => {
    let completed = 0;
    const totalSteps = videoRequired ? 6 : 5;
    if (title) completed++;
    if (category) completed++;
    if (description) completed++;
    if (images.length > 0) completed++;
    if (videoRequired && hasValidVideo) completed++;
    if (estimatedValue) completed++;
    return (completed / totalSteps) * 100;
  };

  const progress = getProgress();
  
  // Dynamic steps based on price
  const steps = videoRequired
    ? [
        { label: "Basic Info", complete: Boolean(title && category) },
        { label: "Images", complete: Boolean(images.length > 0) },
        { label: "Video Proof", complete: hasValidVideo, icon: Video },
        { label: "Pricing", complete: Boolean(estimatedValue) },
      ]
    : [
        { label: "Basic Info", complete: Boolean(title && category) },
        { label: "Details & Photos", complete: Boolean(description && images.length > 0) },
        { label: "Pricing", complete: Boolean(estimatedValue) },
      ];

  const handleVideoChange = (file: File | null, url: string | null) => {
    setVideoFile(file);
    setVideoUrl(url);
  };

  const handleSaveDraft = () => {
    // Save to localStorage for later (video can't be saved to localStorage)
    const draft = { title, category, description, estimatedValue, region, images };
    localStorage.setItem('luxledger_listing_draft', JSON.stringify(draft));
    toast.success('Draft saved! You can finish this listing later.');
    setHasDraft(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold tracking-tight">
              Sign in to list an asset
            </CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              You need an account to submit items for review and listing on LuxLedger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            <Button
              className="w-full rounded-full bg-amber-500 text-black shadow-[0_18px_45px_rgba(0,0,0,0.7)] hover:bg-amber-400"
              onClick={() => navigate("/auth")}
            >
              Go to Sign In
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-full"
              onClick={() => navigate("/marketplace")}
            >
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImagesUploaded = (urls: string[]) => {
    // For now FileUpload uses object URLs; later this should be real storage URLs.
    setImages(urls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !estimatedValue || images.length === 0) {
      toast.error("Please fill in all required fields and upload at least one photo.");
      return;
    }

    // Video validation for high-value assets
    if (videoRequired && !hasValidVideo) {
      toast.error(`A verification video is required for assets valued over $${VIDEO_REQUIRED_THRESHOLD_USD.toLocaleString()}.`);
      return;
    }

    const estimatedNumeric = Number(estimatedValue.replace(/,/g, ""));
    if (Number.isNaN(estimatedNumeric) || estimatedNumeric <= 0) {
      toast.error("Please enter a valid estimated value.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload video to Supabase Storage if provided
      let uploadedVideoUrl: string | null = null;
      
      if (videoFile && hasValidVideo) {
        toast.info("Uploading verification video...");
        const uploadResult = await uploadVideo(videoFile, user.id);
        
        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload video. Please try again.");
          setIsSubmitting(false);
          return;
        }
        
        uploadedVideoUrl = uploadResult.url || null;
        toast.success("Video uploaded successfully!");
      }

      const assetData: Record<string, unknown> = {
        title,
        description,
        category,
        estimated_value: estimatedNumeric,
        images,
        status: "pending_review",
        owner_id: user.id,
        region,
        created_at: new Date().toISOString(),
        has_video: hasValidVideo,
        video_url: uploadedVideoUrl,
      };

      const { error } = await supabase.from("assets").insert(assetData);

      if (error) throw error;

      toast.success("Asset submitted for review. Our team will verify and list it soon.");
      setTitle("");
      setCategory("");
      setDescription("");
      setEstimatedValue("");
      setImages([]);
      setVideoFile(null);
      setVideoUrl(null);
      setRegion("global");

      navigate("/portfolio");
    } catch (err) {
      console.error("Error creating asset listing:", err);
      toast.error("Failed to submit asset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  LIST ASSET
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Create a new luxury listing
                </p>
              </div>
            </div>
            
            {/* Center: Progress */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Progress</p>
                <p className="text-lg font-semibold" style={{ color: progress === 100 ? '#22C55E' : '#D4AF37' }}>
                  {Math.round(progress)}%
                </p>
              </div>
              {videoRequired && (
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Video</p>
                  <p className="text-sm font-medium" style={{ color: hasValidVideo ? '#22C55E' : '#EF4444' }}>
                    {hasValidVideo ? 'Uploaded' : 'Required'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Right: Save Draft */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">

        {/* Step Progress Indicator */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium text-amber-400">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.complete 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-white/5 text-muted-foreground border border-white/10'
                  }`}>
                    {step.complete ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:inline ${step.complete ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
                  Asset details
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  Tell us about your item, add photos, and our team will review it for listing on the marketplace.
                </CardDescription>
              </div>
              <Badge className="self-start border border-amber-500/40 bg-amber-500/10 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-amber-200">
                Mobile optimized
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs uppercase tracking-[0.18em]">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Vintage Rolex Submariner, 18K Gold Necklace"
                    className="bg-black/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.18em]">
                    Category
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as CategoryKey)}
                  >
                    <SelectTrigger className="bg-black/40">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="border border-white/10 bg-neutral-950">
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="watches">Watches</SelectItem>
                      <SelectItem value="art">Fine Art</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="cars">Exotic Cars</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                      <SelectItem value="collectibles">Collectibles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs uppercase tracking-[0.18em]">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the provenance, condition, certification, and any story behind the piece."
                    className="min-h-[100px] bg-black/40"
                  />
                </div>
              </div>

              {/* Photos & valuation */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-[0.18em]">
                    Photos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Upload high-resolution photos from your gallery or camera. Include front, back,
                    details, and any certificates.
                  </p>
                  <FileUpload
                    onUpload={handleImagesUploaded}
                    accept="image/*"
                    multiple
                    maxSize={10 * 1024 * 1024}
                  />
                  {images.length > 0 && (
                    <div className="mt-3">
                      <ImageReorder
                        images={images}
                        onReorder={(newImages) => setImages(newImages)}
                      />
                    </div>
                  )}
                  {images.length === 0 && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span>At least one photo is required to submit your item.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-amber-300" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                        Valuation & region
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated_value" className="text-[0.7rem] uppercase tracking-[0.18em]">
                        Estimated value (USD)
                      </Label>
                      <Input
                        id="estimated_value"
                        type="number"
                        min={0}
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        placeholder="e.g. 45000"
                        className="bg-black/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[0.7rem] uppercase tracking-[0.18em]">
                        Region
                      </Label>
                      <Select
                        value={region}
                        onValueChange={(val) => setRegion(val as RegionKey)}
                      >
                        <SelectTrigger className="bg-black/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border border-white/10 bg-neutral-950">
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="north_america">North America</SelectItem>
                          <SelectItem value="europe">Europe</SelectItem>
                          <SelectItem value="asia">Asia</SelectItem>
                          <SelectItem value="middle_east">Middle East</SelectItem>
                          <SelectItem value="latin_america">Latin America</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-[0.7rem] text-amber-100/80">
                    All submissions are reviewed by our compliance and curation teams. You&apos;ll be
                    notified once your asset is verified and listed on the marketplace.
                  </p>
                </div>
              </div>

              {/* Video Verification Step (conditionally shown for high-value assets) */}
              {(videoRequired || priceUSD > 0) && (
                <VideoUploadStep
                  priceUSD={priceUSD}
                  videoFile={videoFile}
                  videoUrl={videoUrl}
                  onVideoChange={handleVideoChange}
                />
              )}

              {/* Trust Signals */}
              <div className="space-y-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <TrustBadge variant="verification" compact />
                <VerificationStandards />
              </div>

              {/* Video Required Message */}
              <VideoRequiredMessage priceUSD={priceUSD} hasVideo={hasValidVideo} />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="sm:flex-1 gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:flex-[2] rounded-full bg-amber-500 text-black shadow-[0_18px_45px_rgba(0,0,0,0.7)] hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit asset for review"}
                </Button>
              </div>

              {/* Escape Hatches */}
              <EscapeHatches
                onCancel={() => navigate('/marketplace')}
                onSave={handleSaveDraft}
                cancelLabel="Cancel and return"
                saveLabel="Save draft"
                helpContext="listing"
                showSave={false}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
