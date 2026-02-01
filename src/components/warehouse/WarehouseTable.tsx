import { ImageOff, Upload } from "lucide-react";
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
import type { WarehouseItem } from "@/types/warehouse-item";

interface WarehouseTableProps {
  items: WarehouseItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onPlayVideo: (item: WarehouseItem) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "--:--";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 0) return "0 MB";

  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  return `${Math.round(mb)} MB`;
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

function getPlatformBadge(platform: string | null, isManualImport: boolean) {
  if (isManualImport) {
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-500">
        <Upload className="h-3 w-3 mr-1" />
        Manual
      </Badge>
    );
  }

  switch (platform?.toLowerCase()) {
    case "youtube":
      return <Badge variant="outline" className="border-red-500 text-red-500">YouTube</Badge>;
    case "patreon":
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Patreon</Badge>;
    default:
      return <Badge variant="outline">Other</Badge>;
  }
}

function ThumbnailImage({ path, title }: { path: string | null; title: string }) {
  if (!path) {
    return (
      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <img
        src={`file://${path}`}
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
      <div className="w-16 h-10 bg-muted rounded items-center justify-center flex-shrink-0 hidden">
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    </>
  );
}

export function WarehouseTable({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onPlayVideo,
}: WarehouseTableProps) {
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
        No warehouse items found. Try adjusting your filters or import some media.
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
          <TableHead>Title</TableHead>
          <TableHead className="w-[120px]">Platform</TableHead>
          <TableHead className="w-[100px]">Duration</TableHead>
          <TableHead className="w-[100px]">Size</TableHead>
          <TableHead className="w-[120px]">Imported</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);

          return (
            <TableRow
              key={item.id}
              data-state={isSelected ? "selected" : undefined}
              className="cursor-pointer"
              onClick={(e) => {
                // Don't trigger play if clicking on checkbox
                if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                  return;
                }
                onPlayVideo(item);
              }}
            >
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item.id)}
                  aria-label={`Select ${item.title}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <ThumbnailImage path={item.thumbnail_path} title={item.title} />
                  <span className="truncate max-w-[400px]" title={item.title}>
                    {item.title}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getPlatformBadge(item.platform, item.is_manual_import)}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono">
                {formatDuration(item.duration)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatFileSize(item.file_size)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeDate(item.imported_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
