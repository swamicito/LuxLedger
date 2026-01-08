/**
 * Reorderable Image Grid
 * Drag-and-drop image reordering with delete capability
 */

import { useState } from "react";
import { X, GripVertical, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageReorderProps {
  images: string[];
  onReorder: (images: string[]) => void;
  onRemove?: (index: number) => void;
}

export function ImageReorder({ images, onReorder, onRemove }: ImageReorderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    onReorder(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveImage = (fromIndex: number, direction: "left" | "right") => {
    const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
    onReorder(newImages);
  };

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
    } else {
      const newImages = images.filter((_, i) => i !== index);
      onReorder(newImages);
    }
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    
    const newImages = [...images];
    const [image] = newImages.splice(index, 1);
    newImages.unshift(image);
    onReorder(newImages);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Drag to reorder • First image is the cover photo
        </p>
        <span className="text-xs text-amber-400">{images.length} photo{images.length !== 1 ? "s" : ""}</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200
              ${draggedIndex === index ? "opacity-50 scale-95" : ""}
              ${dragOverIndex === index && draggedIndex !== index ? "border-amber-400 scale-105" : "border-white/10"}
              ${index === 0 ? "ring-2 ring-amber-500/50" : ""}
              group cursor-grab active:cursor-grabbing
            `}
          >
            {/* Image */}
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="h-full w-full object-cover"
              draggable={false}
            />
            
            {/* Primary badge */}
            {index === 0 && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[0.6rem] font-medium text-black">
                <Star className="h-2.5 w-2.5" />
                Cover
              </div>
            )}
            
            {/* Drag handle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Controls overlay */}
            <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                {/* Move buttons */}
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-black/50 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveImage(index, "left");
                    }}
                    disabled={index === 0}
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-black/50 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveImage(index, "right");
                    }}
                    disabled={index === images.length - 1}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Set as primary / Delete */}
                <div className="flex gap-1">
                  {index !== 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-amber-500/80 hover:bg-amber-500 text-black"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsPrimary(index);
                      }}
                      title="Set as cover photo"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-red-500/80 hover:bg-red-500 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    title="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Drag indicator */}
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="rounded bg-black/50 p-1">
                <GripVertical className="h-3 w-3 text-white" />
              </div>
            </div>
            
            {/* Position number */}
            <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {index + 1}/{images.length}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-[0.65rem] text-muted-foreground">
        💡 Tip: The first image will be shown as the cover in marketplace listings
      </p>
    </div>
  );
}
