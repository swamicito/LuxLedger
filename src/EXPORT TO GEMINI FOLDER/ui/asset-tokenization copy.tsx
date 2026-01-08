import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface TokenizeAssetProps {
  className?: string;
}

export function TokenizeAsset({ className }: TokenizeAssetProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return (
      <Button variant="outline" className={className} asChild>
        <a href="/auth">
          <Plus className="w-4 h-4 mr-2" />
          Tokenize Asset
        </a>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Plus className="w-4 h-4 mr-2" />
          Tokenize Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Tokenize Your Asset
          </DialogTitle>
        </DialogHeader>
        <p>Asset tokenization form will be implemented here.</p>
      </DialogContent>
    </Dialog>
  );
}