import { useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckCircle2, Circle, Loader2, XCircle, ImageOff, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types/feed-item";
import type { Source } from "@/types/source";
import type { DownloadProgress } from "@/pages/creator/Feed";

const ROW_HEIGHT = 64; // Slightly taller for better spacing

interface FeedTableProps {
  items: FeedItem[];
  sources: Source[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  downloadProgress?: Map<string, DownloadProgress>;
  loadingMetadataIds?: Set<string>;
  onVisibleItemsChange?: (visibleIds: Set<string>) => void;
}

function DownloadProgressRing({ percent }: { percent: number }) {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="progress-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--glow))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
          style={{ filter: "drop-shadow(0 0 4px hsl(var(--glow) / 0.5))" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-glow">
        {percent}
      </span>
    </div>
  );
}

function getStatusIcon(status: FeedItem["download_status"], progress?: DownloadProgress) {
  switch (status) {
    case "downloaded":
      return (
        <span title="Downloaded" className="flex items-center justify-center w-6 h-6">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </span>
      );
    case "not_downloaded":
      return (
        <span title="Not Downloaded" className="flex items-center justify-center w-6 h-6">
          <Circle className="h-5 w-5 text-muted-foreground/50" />
        </span>
      );
    case "downloading":
      return progress ? (
        <span title={`Downloading: ${progress.percent}%`}>
          <DownloadProgressRing percent={progress.percent} />
        </span>
      ) : (
        <span title="Downloading" className="flex items-center justify-center w-6 h-6">
          <Loader2 className="h-5 w-5 text-glow animate-spin" />
        </span>
      );
    case "error":
      return (
        <span title="Error" className="flex items-center justify-center w-6 h-6">
          <XCircle className="h-5 w-5 text-destructive" />
        </span>
      );
  }
}

function getPlatformBadge(platform: Source["platform"]) {
  switch (platform) {
    case "youtube":
      return (
        <Badge variant="outline" className="platform-youtube platform-badge-filled text-xs px-2 py-0">
          YouTube
        </Badge>
      );
    case "patreon":
      return (
        <Badge variant="outline" className="platform-patreon platform-badge-filled text-xs px-2 py-0">
          Patreon
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs px-2 py-0">Unknown</Badge>;
  }
}

function formatRelativeDate(
  dateString: string | null,
  metadataComplete: boolean,
  isLoadingMetadata: boolean
): { text: string; status: "loaded" | "loading" | "pending" } {
  if (!dateString) {
    if (metadataComplete) {
      return { text: "Unknown", status: "loaded" };
    }
    return {
      text: isLoadingMetadata ? "Loading..." : "Pending",
      status: isLoadingMetadata ? "loading" : "pending",
    };
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

  return { text, status: "loaded" };
}

function ThumbnailImage({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return (
      <div className="w-20 h-12 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative w-20 h-12 flex-shrink-0 group/thumb">
      <img
        src={url}
        alt={title}
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling;
          if (fallback) {
            (fallback as HTMLElement).style.display = "flex";
          }
        }}
      />
      <div className="hidden w-full h-full bg-muted/50 rounded-lg items-center justify-center">
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </div>
  );
}

export function FeedTable({
  items,
  sources,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  downloadProgress,
  loadingMetadataIds,
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
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">No feed items found</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your filters or sync your sources</p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
      {/* Fixed header */}
      <div className="flex items-center h-12 px-4 border-b border-border/50 bg-muted/30 text-sm font-medium text-muted-foreground">
        <div className="w-12 flex-shrink-0 flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
            className="border-muted-foreground/30"
            {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
          />
        </div>
        <div className="w-10 flex-shrink-0 text-center">Status</div>
        <div className="flex-1 min-w-0 pl-2">Title</div>
        <div className="w-28 flex-shrink-0 text-right pr-4">Published</div>
        <div className="w-28 flex-shrink-0">Source</div>
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-320px)] overflow-auto"
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
            const isLoadingMetadata = loadingMetadataIds?.has(item.id) ?? false;
            const dateInfo = formatRelativeDate(item.published_at, item.metadata_complete, isLoadingMetadata);

            return (
              <div
                key={item.id}
                className={cn(
                  "absolute left-0 right-0 flex items-center px-4 border-b border-border/30",
                  "hover:bg-muted/30 transition-colors",
                  isSelected && "bg-glow/5 border-l-2 border-l-glow"
                )}
                style={{
                  height: ROW_HEIGHT,
                  top: virtualRow.start,
                }}
              >
                {/* Checkbox */}
                <div className="w-12 flex-shrink-0 flex items-center justify-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    aria-label={`Select ${item.title}`}
                    className={cn(
                      "border-muted-foreground/30",
                      isSelected && "border-glow data-[state=checked]:bg-glow data-[state=checked]:border-glow"
                    )}
                  />
                </div>

                {/* Status */}
                <div className="w-10 flex-shrink-0 flex items-center justify-center">
                  {getStatusIcon(item.download_status, downloadProgress?.get(item.id))}
                </div>

                {/* Title with thumbnail */}
                <div className="flex-1 min-w-0 flex items-center gap-3 pl-2 pr-4">
                  <ThumbnailImage url={item.thumbnail_url} title={item.title} />
                  <span className="truncate text-sm font-medium" title={item.title}>
                    {item.title}
                  </span>
                </div>

                {/* Published */}
                <div className="w-28 flex-shrink-0 text-right pr-4">
                  {dateInfo.status === "loading" ? (
                    <span className="flex items-center justify-end gap-1.5 text-muted-foreground/50">
                      <Clock className="h-3 w-3 animate-pulse" />
                      <span className="text-xs">{dateInfo.text}</span>
                    </span>
                  ) : dateInfo.status === "pending" ? (
                    <span className="text-xs text-muted-foreground/30">{dateInfo.text}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{dateInfo.text}</span>
                  )}
                </div>

                {/* Source */}
                <div className="w-28 flex-shrink-0">
                  {source ? (
                    <div className="flex flex-col gap-0.5">
                      {getPlatformBadge(source.platform)}
                      {source.channel_name && (
                        <span className="text-xs text-muted-foreground/60 truncate max-w-[100px]" title={source.channel_name}>
                          {source.channel_name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">Unknown</Badge>
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
