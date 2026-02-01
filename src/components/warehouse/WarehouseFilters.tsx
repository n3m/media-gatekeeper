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

export const WAREHOUSE_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
  { value: "largest", label: "Largest First" },
  { value: "smallest", label: "Smallest First" },
] as const;

export type WarehouseSortBy = (typeof WAREHOUSE_SORT_OPTIONS)[number]["value"];

const PLATFORM_OPTIONS = [
  { value: "all", label: "All Platforms" },
  { value: "youtube", label: "YouTube" },
  { value: "patreon", label: "Patreon" },
  { value: "other", label: "Other" },
] as const;

interface WarehouseFiltersProps {
  selectedPlatform: string | null;
  onPlatformChange: (platform: string | null) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function WarehouseFilters({
  selectedPlatform,
  onPlatformChange,
  sortBy,
  onSortByChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: WarehouseFiltersProps) {
  const hasActiveFilters =
    selectedPlatform !== null ||
    sortBy !== "newest" ||
    searchQuery.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Platform Filter */}
      <Select
        value={selectedPlatform ?? "all"}
        onValueChange={(value) =>
          onPlatformChange(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Platforms" />
        </SelectTrigger>
        <SelectContent>
          {PLATFORM_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort By */}
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Newest First" />
        </SelectTrigger>
        <SelectContent>
          {WAREHOUSE_SORT_OPTIONS.map((option) => (
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
