import { CheckCircle2, Circle, Loader2, XCircle, ImageOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FeedItem } from "@/types/feed-item";
import type { Source } from "@/types/source";

interface FeedTableProps {
  items: FeedItem[];
  sources: Source[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

function getStatusIcon(status: FeedItem["download_status"]) {
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
        <span title="Downloading">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
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

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString();
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
}: FeedTableProps) {
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id));

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
              {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
            />
          </TableHead>
          <TableHead className="w-[50px]">Status</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="w-[120px]">Published</TableHead>
          <TableHead className="w-[120px]">Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const source = sourceMap.get(item.source_id);
          const isSelected = selectedIds.has(item.id);

          return (
            <TableRow
              key={item.id}
              data-state={isSelected ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item.id)}
                  aria-label={`Select ${item.title}`}
                />
              </TableCell>
              <TableCell>{getStatusIcon(item.download_status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <ThumbnailImage url={item.thumbnail_url} title={item.title} />
                  <span className="truncate max-w-[400px]" title={item.title}>
                    {item.title}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeDate(item.published_at)}
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
