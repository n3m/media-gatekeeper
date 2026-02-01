import { Search, X } from "lucide-react";
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
      {/* Source Filter */}
      <Select
        value={selectedSourceId ?? "all"}
        onValueChange={(value) =>
          onSourceChange(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
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
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
