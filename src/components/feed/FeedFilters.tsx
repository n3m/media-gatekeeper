import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Source } from "@/types/source";
import { cn } from "@/lib/utils";

export type FeedItemStatus =
  | "not_downloaded"
  | "downloading"
  | "downloaded"
  | "error";

interface FeedFiltersProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSourceChange: (id: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { value: FeedItemStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "not_downloaded", label: "Not Downloaded" },
  { value: "downloading", label: "Downloading" },
  { value: "downloaded", label: "Downloaded" },
  { value: "error", label: "Error" },
];

export function FeedFilters({
  sources,
  selectedSourceId,
  onSourceChange,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: FeedFiltersProps) {
  const hasActiveFilters =
    selectedSourceId !== null ||
    selectedStatus !== null ||
    searchQuery.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter icon indicator */}
      <div className={cn(
        "flex items-center gap-2 text-sm",
        hasActiveFilters ? "text-glow" : "text-muted-foreground"
      )}>
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
      </div>

      {/* Source Filter */}
      <Select
        value={selectedSourceId ?? "all"}
        onValueChange={(value) =>
          onSourceChange(value === "all" ? null : value)
        }
      >
        <SelectTrigger className={cn(
          "w-[180px] bg-surface border-border/50",
          selectedSourceId && "border-glow/30 text-glow"
        )}>
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent className="glass border-border/50">
          <SelectItem value="all">All Sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {source.channel_name || source.channel_url}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={selectedStatus ?? "all"}
        onValueChange={(value) =>
          onStatusChange(value === "all" ? null : value)
        }
      >
        <SelectTrigger className={cn(
          "w-[160px] bg-surface border-border/50",
          selectedStatus && "border-glow/30 text-glow"
        )}>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="glass border-border/50">
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search Input */}
      <div className="relative flex-1 min-w-[180px] max-w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search titles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "pl-9 bg-surface border-border/50",
            searchQuery && "border-glow/30"
          )}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-glow hover:bg-glow/10"
        >
          <X className="h-4 w-4 mr-1.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
