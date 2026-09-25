import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImages } from "@/lib/storage";

interface FileUploadProps {
  onUpload: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  storageUserId?: string;
}

export function FileUpload({ 
  onUpload, 
  accept = "*/*", 
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  storageUserId,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      if (storageUserId) {
        // Storage-backed mode: upload to the asset-images bucket first and only
        // hand back public URLs. Never fall back to blob: URLs here.
        const results = await uploadImages(validFiles, storageUserId);
        const urls = results
          .map(r => r.url)
          .filter((url): url is string => !!url && !url.startsWith('blob:'));
        const failures = results.filter(r => !r.success || !r.url);
        if (failures.length > 0) {
          const reason = failures.map(f => f.error).filter(Boolean).join('; ') || 'unknown error';
          console.error('Image upload failures:', failures);
          toast.error(`${failures.length} image(s) failed to upload: ${reason}`);
        }
        if (urls.length > 0) {
          onUpload(urls);
          toast.success(`${urls.length} photo(s) uploaded`);
        }
        return;
      }

      // Preview-only mode (no storage user): local object URLs for in-tab display.
      const urls = validFiles.map(file => URL.createObjectURL(file));
      onUpload(urls);
      toast.success(`${urls.length} file(s) added`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? `Upload failed: ${error.message}` : "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
        dragActive 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {dragActive ? "Drop files here" : "Drag and drop files here"}
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Max file size: {maxSize / 1024 / 1024}MB
          </p>
        </div>
        
        {uploading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
}