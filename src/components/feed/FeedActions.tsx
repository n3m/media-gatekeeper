import { Download, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedActionsProps {
  selectedCount: number;
  totalCount: number;
  onDownloadSelected: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export function FeedActions({
  selectedCount,
  totalCount,
  onDownloadSelected,
  onSyncNow,
  isSyncing,
}: FeedActionsProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center gap-4">
      {hasSelection && (
        <span className="text-sm text-muted-foreground">
          {selectedCount} of {totalCount} selected
        </span>
      )}
      <Button
        variant="outline"
        onClick={onDownloadSelected}
        disabled={!hasSelection}
      >
        <Download className="h-4 w-4 mr-2" />
        Download Selected
      </Button>
      <Button onClick={onSyncNow} disabled={isSyncing}>
        {isSyncing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        Sync Now
      </Button>
    </div>
  );
}
