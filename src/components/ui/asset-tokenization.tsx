import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface TokenizeAssetProps {
  className?: string;
}

export function TokenizeAsset({ className }: TokenizeAssetProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Button variant="outline" className={className} asChild>
        <a href="/auth">
          <Plus className="w-4 h-4 mr-2" />
          List an Asset
        </a>
      </Button>
    );
  }

  return (
    <Button variant="outline" className={className} asChild>
      <a href="/list-asset">
        <Plus className="w-4 h-4 mr-2" />
        List an Asset
      </a>
    </Button>
  );
}