import { Download, RefreshCw, Loader2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedActionsProps {
  selectedCount: number;
  totalCount: number;
  onDownloadSelected: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export function FeedActions({
  selectedCount,
  totalCount: _totalCount,
  onDownloadSelected,
  onSyncNow,
  isSyncing,
}: FeedActionsProps) {
  void _totalCount; // Available for future use
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center gap-3">
      {/* Selection indicator */}
      {hasSelection && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-glow/10 rounded-lg border border-glow/20 animate-fade-in">
          <CheckSquare className="h-4 w-4 text-glow" />
          <span className="text-sm font-medium text-glow">
            {selectedCount} selected
          </span>
        </div>
      )}

      {/* Download button */}
      <Button
        variant="outline"
        onClick={onDownloadSelected}
        disabled={!hasSelection}
        className={cn(
          "border-border/50",
          hasSelection && "border-glow/30 text-glow hover:bg-glow/10 hover:text-glow"
        )}
      >
        <Download className="h-4 w-4 mr-2" />
        Download{hasSelection ? ` (${selectedCount})` : ""}
      </Button>

      {/* Sync button */}
      <Button
        onClick={onSyncNow}
        disabled={isSyncing}
        className="bg-glow hover:bg-glow/90 text-glow-foreground shadow-lg shadow-glow/20"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </>
        )}
      </Button>
    </div>
  );
}
