import { useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckCircle2, Circle, Loader2, XCircle, ImageOff, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types/feed-item";
import type { Source } from "@/types/source";
import type { DownloadProgress } from "@/pages/creator/Feed";

const ROW_HEIGHT = 56; // Fixed row height for virtualization

interface FeedTableProps {
  items: FeedItem[];
  sources: Source[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  downloadProgress?: Map<string, DownloadProgress>;
  /** Callback when visible items change (for progressive metadata loading) */
  onVisibleItemsChange?: (visibleIds: Set<string>) => void;
}

function getStatusIcon(status: FeedItem["download_status"], progress?: DownloadProgress) {
  switch (status) {
    case "downloaded":
      return (
        <span title="Downloaded">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </span>
      );
    case "not_downloaded":
      return (
        <span title="Not Downloaded">
          <Circle className="h-5 w-5 text-muted-foreground" />
        </span>
      );
    case "downloading":
      return (
        <span title={progress ? `Downloading: ${progress.percent}%` : "Downloading"} className="flex items-center gap-1">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          {progress && (
            <span className="text-xs text-blue-500 font-medium">
              {progress.percent}%
            </span>
          )}
        </span>
      );
    case "error":
      return (
        <span title="Error">
          <XCircle className="h-5 w-5 text-destructive" />
        </span>
      );
  }
}

function getPlatformBadge(platform: Source["platform"]) {
  switch (platform) {
    case "youtube":
      return <Badge variant="outline" className="border-red-500 text-red-500">YouTube</Badge>;
    case "patreon":
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Patreon</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function formatRelativeDate(dateString: string | null, metadataComplete: boolean): { text: string; loading: boolean } {
  if (!dateString) {
    // Show loading state if metadata is incomplete
    return { text: metadataComplete ? "Unknown" : "Loading...", loading: !metadataComplete };
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let text: string;
  if (diffDays === 0) text = "Today";
  else if (diffDays === 1) text = "Yesterday";
  else if (diffDays < 7) text = `${diffDays} days ago`;
  else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    text = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    text = `${months} month${months > 1 ? "s" : ""} ago`;
  }
  else {
    text = date.toLocaleDateString();
  }

  return { text, loading: false };
}

function ThumbnailImage({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return (
      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className="w-16 h-10 object-cover rounded flex-shrink-0"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const fallback = target.nextElementSibling;
        if (fallback) {
          (fallback as HTMLElement).style.display = "flex";
        }
      }}
    />
  );
}

export function FeedTable({
  items,
  sources,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  downloadProgress,
  onVisibleItemsChange,
}: FeedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sourceMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id));

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Report visible items to parent for metadata loading
  useEffect(() => {
    if (!onVisibleItemsChange) return;

    const visibleIds = new Set(
      virtualRows.map((vRow) => items[vRow.index].id)
    );
    onVisibleItemsChange(visibleIds);
  }, [virtualRows, items, onVisibleItemsChange]);

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(items.map((item) => item.id));
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feed items found. Try adjusting your filters or sync your sources.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      {/* Fixed header */}
      <div className="flex items-center h-10 px-2 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
        <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
            {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
          />
        </div>
        <div className="w-[50px] flex-shrink-0">Status</div>
        <div className="flex-1 min-w-0">Title</div>
        <div className="w-[120px] flex-shrink-0">Published</div>
        <div className="w-[120px] flex-shrink-0">Source</div>
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-300px)] overflow-auto"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualRows.map((virtualRow) => {
            const item = items[virtualRow.index];
            const source = sourceMap.get(item.source_id);
            const isSelected = selectedIds.has(item.id);
            const dateInfo = formatRelativeDate(item.published_at, item.metadata_complete);

            return (
              <div
                key={item.id}
                className={cn(
                  "absolute left-0 right-0 flex items-center px-2 border-b hover:bg-muted/50 transition-colors",
                  isSelected && "bg-muted"
                )}
                style={{
                  height: ROW_HEIGHT,
                  top: virtualRow.start,
                }}
              >
                {/* Checkbox */}
                <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    aria-label={`Select ${item.title}`}
                  />
                </div>

                {/* Status */}
                <div className="w-[50px] flex-shrink-0 flex items-center">
                  {getStatusIcon(item.download_status, downloadProgress?.get(item.id))}
                </div>

                {/* Title with thumbnail */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <ThumbnailImage url={item.thumbnail_url} title={item.title} />
                  <span className="truncate" title={item.title}>
                    {item.title}
                  </span>
                </div>

                {/* Published */}
                <div className="w-[120px] flex-shrink-0 text-muted-foreground">
                  {dateInfo.loading ? (
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <Clock className="h-3 w-3 animate-pulse" />
                      <span className="text-xs">{dateInfo.text}</span>
                    </span>
                  ) : (
                    dateInfo.text
                  )}
                </div>

                {/* Source */}
                <div className="w-[120px] flex-shrink-0">
                  {source ? (
                    <div className="flex flex-col gap-1">
                      {getPlatformBadge(source.platform)}
                      {source.channel_name && (
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={source.channel_name}>
                          {source.channel_name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline">Unknown</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
