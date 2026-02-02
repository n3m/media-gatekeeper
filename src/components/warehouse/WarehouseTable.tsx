import { ImageOff, Upload, Play } from "lucide-react";
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
import { formatDuration, formatFileSize, cn } from "@/lib/utils";
import type { WarehouseItem } from "@/types/warehouse-item";

interface WarehouseTableProps {
  items: WarehouseItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onPlayVideo: (item: WarehouseItem) => void;
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
      <Badge variant="outline" className="platform-manual platform-badge-filled text-xs">
        <Upload className="h-3 w-3 mr-1" />
        Manual
      </Badge>
    );
  }

  switch (platform?.toLowerCase()) {
    case "youtube":
      return <Badge variant="outline" className="platform-youtube platform-badge-filled text-xs">YouTube</Badge>;
    case "patreon":
      return <Badge variant="outline" className="platform-patreon platform-badge-filled text-xs">Patreon</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Other</Badge>;
  }
}

function ThumbnailImage({ path, title }: { path: string | null; title: string }) {
  if (!path) {
    return (
      <div className="w-20 h-12 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative w-20 h-12 flex-shrink-0 group/thumb">
      <img
        src={`file://${path}`}
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
      <div className="w-full h-full bg-muted/50 rounded-lg items-center justify-center hidden">
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity">
        <Play className="h-5 w-5 text-white fill-white" />
      </div>
    </div>
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">No videos in warehouse</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Download from feed or import manually</p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                className="border-muted-foreground/30"
                {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead className="font-medium">Title</TableHead>
            <TableHead className="w-[100px] font-medium">Platform</TableHead>
            <TableHead className="w-[90px] font-medium">Duration</TableHead>
            <TableHead className="w-[80px] font-medium">Size</TableHead>
            <TableHead className="w-[100px] font-medium">Imported</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <TableRow
                key={item.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(
                  "cursor-pointer border-b border-border/30 transition-colors",
                  "hover:bg-muted/30",
                  isSelected && "bg-glow/5 border-l-2 border-l-glow",
                  "opacity-0 animate-fade-up"
                )}
                style={{ animationDelay: `${Math.min(index, 10) * 30}ms`, animationFillMode: "forwards" }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                    return;
                  }
                  onPlayVideo(item);
                }}
              >
                <TableCell className="py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    aria-label={`Select ${item.title}`}
                    className={cn(
                      "border-muted-foreground/30",
                      isSelected && "border-glow data-[state=checked]:bg-glow data-[state=checked]:border-glow"
                    )}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <ThumbnailImage path={item.thumbnail_path} title={item.title} />
                    <span className="truncate max-w-[350px] font-medium" title={item.title}>
                      {item.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  {getPlatformBadge(item.platform, item.is_manual_import)}
                </TableCell>
                <TableCell className="py-3 text-muted-foreground font-mono text-sm">
                  {formatDuration(item.duration)}
                </TableCell>
                <TableCell className="py-3 text-muted-foreground text-sm">
                  {formatFileSize(item.file_size)}
                </TableCell>
                <TableCell className="py-3 text-muted-foreground text-sm">
                  {formatRelativeDate(item.imported_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
