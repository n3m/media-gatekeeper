import { useState, useMemo, useCallback } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WarehouseFilters, type WarehouseSortBy } from "@/components/warehouse/WarehouseFilters";
import { WarehouseTable } from "@/components/warehouse/WarehouseTable";
import { ImportVideoDialog } from "@/components/warehouse/ImportVideoDialog";
import { VideoPlayerModal } from "@/components/player/VideoPlayerModal";
import { useWarehouseItems } from "@/hooks/useWarehouseItems";
import type { WarehouseItem } from "@/types/warehouse-item";

interface WarehouseProps {
  creatorId: string;
}

export function Warehouse({ creatorId }: WarehouseProps) {
  // Fetch data
  const { warehouseItems, loading, error, refetch, deleteItem } = useWarehouseItems(creatorId);

  // Filter state
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<WarehouseSortBy>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Video player state
  const [selectedVideo, setSelectedVideo] = useState<WarehouseItem | null>(null);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items: WarehouseItem[] = [...warehouseItems];

    // Filter by platform
    if (selectedPlatform !== null) {
      items = items.filter((item) => {
        if (selectedPlatform === "other") {
          // "other" matches items where platform is not youtube or patreon
          const platform = item.platform?.toLowerCase();
          return platform !== "youtube" && platform !== "patreon";
        }
        return item.platform?.toLowerCase() === selectedPlatform.toLowerCase();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(query));
    }

    // Sort items
    switch (sortBy) {
      case "newest":
        items.sort((a, b) => new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime());
        break;
      case "oldest":
        items.sort((a, b) => new Date(a.imported_at).getTime() - new Date(b.imported_at).getTime());
        break;
      case "title_asc":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        items.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "largest":
        items.sort((a, b) => b.file_size - a.file_size);
        break;
      case "smallest":
        items.sort((a, b) => a.file_size - b.file_size);
        break;
    }

    return items;
  }, [warehouseItems, selectedPlatform, sortBy, searchQuery]);

  // Handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedPlatform(null);
    setSortBy("newest");
    setSearchQuery("");
  }, []);

  const handlePlayVideo = useCallback((item: WarehouseItem) => {
    setSelectedVideo(item);
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const idsToDelete = Array.from(selectedIds);
      let successCount = 0;
      let errorCount = 0;

      for (const id of idsToDelete) {
        try {
          await deleteItem(id);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} item${successCount === 1 ? "" : "s"}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} item${errorCount === 1 ? "" : "s"}`);
      }

      setSelectedIds(new Set());
    } catch (err) {
      toast.error(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [selectedIds, deleteItem]);

  const handleImported = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading warehouse...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Error loading warehouse: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <WarehouseFilters
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          sortBy={sortBy}
          onSortByChange={(value) => setSortBy(value as WarehouseSortBy)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <ImportVideoDialog creatorId={creatorId} onImported={handleImported} />
        </div>
      </div>
      <WarehouseTable
        items={filteredItems}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onPlayVideo={handlePlayVideo}
      />

      <VideoPlayerModal
        item={selectedVideo}
        open={selectedVideo !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(null);
        }}
      />
    </div>
  );
}
